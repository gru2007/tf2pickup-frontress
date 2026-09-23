import type { z } from 'zod'
import { MongoServerError } from 'mongodb'
import { collections } from '../database/collections'
import { GameEventType } from '../database/models/game-event.model'
import { PlayerConnectionStatus, SlotStatus } from '../database/models/game-slot.model'
import { GameKind, GameState, type GameModel, type GameNumber } from '../database/models/game.model'
import { errors } from '../errors'
import { events } from '../events'
import { frontressGameClass } from '../shared/types/game-class-name'
import type { GameSlotId } from '../shared/types/game-slot-id'
import { Tf2ClassName } from '../shared/types/tf2-class-name'
import { createGameSchema } from './schemas/create-game'
import { ensurePlayers } from './ensure-players'
import { createMutex } from '../games/create-mutex'
import { assertPlayersAvailable } from './assert-players-available'

type CreateGame = z.infer<typeof createGameSchema>
type FrontressMatchMode = 'frontline' | 'ranked'

export async function createGame(
  input: CreateGame,
): Promise<{ game: GameModel; created: boolean }> {
  return await createMutex.runExclusive(async () => await createGameUnlocked(input))
}

async function createGameUnlocked(
  input: CreateGame,
): Promise<{ game: GameModel; created: boolean }> {
  const existing = await collections.games.findOne({
    'frontress.externalMatchId': input.externalMatchId,
  })
  if (existing) {
    assertSameGame(existing, input)
    await assignActiveGame(existing)
    return { game: existing, created: false }
  }

  await assertPlayersAvailable(input.players.map(player => player.steamId))

  await ensurePlayers(input.players)
  const counts = { red: 0, blu: 0 }
  const game: GameModel = {
    number: await getNextGameNumber(),
    map: input.map,
    state: GameState.created,
    kind: GameKind.frontress,
    frontress: {
      externalMatchId: input.externalMatchId,
      matchGroup: input.matchGroup,
      matchMode: effectiveMatchMode(input),
      maxPlayers: input.maxPlayers,
      serverConfig: input.serverConfig,
      matchEmulation: input.matchEmulation,
      admissions: [],
    },
    slots: input.players.map(player => ({
      id: `${player.team}-${frontressGameClass}-${++counts[player.team]}` as GameSlotId,
      player: player.steamId,
      team: player.team,
      gameClass: Tf2ClassName.scout,
      ratingClass: frontressGameClass,
      status: SlotStatus.active,
      connectionStatus: PlayerConnectionStatus.offline,
    })),
    events: [{ at: new Date(), event: GameEventType.gameCreated }],
  }

  try {
    const { insertedId } = await collections.games.insertOne(game)
    const inserted = await collections.games.findOne({ _id: insertedId })
    if (!inserted) throw new Error('failed creating Frontress game')
    await assignActiveGame(inserted)
    events.emit('game:created', { game: inserted })
    return { game: inserted, created: true }
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const raced = await collections.games.findOne({
        'frontress.externalMatchId': input.externalMatchId,
      })
      if (raced) {
        assertSameGame(raced, input)
        await assignActiveGame(raced)
        return { game: raced, created: false }
      }
    }
    throw error
  }
}

async function assignActiveGame(game: GameModel): Promise<void> {
  await assertPlayersAvailable(
    game.slots.map(slot => slot.player),
    game.number,
  )
  await collections.players.updateMany(
    { steamId: { $in: game.slots.map(slot => slot.player) } },
    { $set: { activeGame: game.number } },
  )
}

async function getNextGameNumber(): Promise<GameNumber> {
  const latest = await collections.games.findOne({}, { sort: { 'events.0.at': -1 } })
  return (latest ? latest.number + 1 : 1) as GameNumber
}

function effectiveMatchMode(input: CreateGame): FrontressMatchMode {
  return input.matchMode ?? (input.matchEmulation === 2 ? 'ranked' : 'frontline')
}

function assertSameGame(game: GameModel, input: CreateGame): void {
  const roster = game.slots
    .map(slot => `${slot.player}:${slot.team}`)
    .sort()
    .join(',')
  const requestedRoster = input.players
    .map(player => `${player.steamId}:${player.team}`)
    .sort()
    .join(',')
  if (
    game.kind !== GameKind.frontress ||
    game.map !== input.map ||
    game.frontress?.matchGroup !== input.matchGroup ||
    (game.frontress.matchMode !== undefined &&
      game.frontress.matchMode !== effectiveMatchMode(input)) ||
    game.frontress.maxPlayers !== input.maxPlayers ||
    game.frontress.serverConfig !== input.serverConfig ||
    game.frontress.matchEmulation !== input.matchEmulation ||
    roster !== requestedRoster
  ) {
    throw errors.conflict(`externalMatchId ${input.externalMatchId} belongs to another game`)
  }
}
