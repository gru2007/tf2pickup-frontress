import type { z } from 'zod'
import { collections } from '../database/collections'
import { GameKind, GameState, type GameModel } from '../database/models/game.model'
import { PlayerConnectionStatus, SlotStatus } from '../database/models/game-slot.model'
import { errors } from '../errors'
import { createMutex } from '../games/create-mutex'
import { update } from '../games/update'
import { withRcon } from '../games/rcon/with-rcon'
import { frontressGameClass } from '../shared/types/game-class-name'
import type { GameSlotId } from '../shared/types/game-slot-id'
import type { RconCommand } from '../shared/types/rcon-command'
import { Tf2ClassName } from '../shared/types/tf2-class-name'
import { Tf2Team } from '../shared/types/tf2-team'
import { ensurePlayers } from './ensure-players'
import { addPlayersSchema } from './schemas/add-players'

type AddPlayers = z.infer<typeof addPlayersSchema>['players']

export async function addPlayers(
  externalMatchId: string,
  additions: AddPlayers,
): Promise<GameModel> {
  return await createMutex.runExclusive(async () => {
    const game = await collections.games.findOne({ 'frontress.externalMatchId': externalMatchId })
    if (game?.kind !== GameKind.frontress || !game.frontress) {
      throw errors.notFound('Frontress game not found')
    }
    if (![GameState.launching, GameState.started].includes(game.state)) {
      throw errors.conflict('Frontress game is not accepting players')
    }

    const existing = new Set(game.slots.map(slot => slot.player))
    const unique = new Set(additions.map(player => player.steamId))
    if (unique.size !== additions.length) throw errors.badRequest('duplicate player')
    const existingAdditions = additions.filter(player => existing.has(player.steamId))
    if (existingAdditions.length === additions.length) {
      const teamsMatch = additions.every(
        player => game.slots.find(slot => slot.player === player.steamId)?.team === player.team,
      )
      if (!teamsMatch) throw errors.conflict('player already exists on another team')
      await assignActiveGame(game, additions)
      return game
    }
    if (existingAdditions.length > 0)
      throw errors.conflict('request mixes existing and new players')
    if (game.slots.length + additions.length > game.frontress.maxPlayers) {
      throw errors.conflict('Frontress game is full')
    }

    const owned = await collections.players
      .find(
        {
          steamId: { $in: additions.map(player => player.steamId) },
          activeGame: { $exists: true },
        },
        { projection: { steamId: 1, activeGame: 1 } },
      )
      .toArray()
    const conflict = owned.find(player => player.activeGame !== game.number)
    if (conflict) throw errors.conflict(`player ${conflict.steamId} already has an active game`)

    const teamCap = game.frontress.maxPlayers / 2
    for (const team of Object.values(Tf2Team)) {
      const count = game.slots.filter(slot => slot.team === team).length
      const added = additions.filter(player => player.team === team).length
      if (count + added > teamCap) throw errors.conflict(`${team} team is full`)
    }

    await ensurePlayers(additions)
    const roster = additions
      .map(player => `${player.steamId}:${player.team === Tf2Team.red ? 2 : 3}`)
      .join(',')
    const command = `tf_mm_match_add "${externalMatchId}" "${roster}"` as RconCommand
    const response = await withRcon(game, async ({ rcon }) => await rcon.send(command))
    if (
      !response.toLowerCase().includes('unknown command') &&
      !response.includes('TFMM_MATCH_ADD_OK') &&
      !response.includes('TFMM_MATCH_ADD_PLAIN')
    ) {
      throw errors.badGateway(`game server did not acknowledge tf_mm_match_add`)
    }

    const counts = {
      [Tf2Team.red]: game.slots.filter(slot => slot.team === Tf2Team.red).length,
      [Tf2Team.blu]: game.slots.filter(slot => slot.team === Tf2Team.blu).length,
    }
    const slots = additions.map(player => ({
      id: `${player.team}-${frontressGameClass}-${++counts[player.team]}` as GameSlotId,
      player: player.steamId,
      team: player.team,
      gameClass: Tf2ClassName.scout,
      ratingClass: frontressGameClass,
      status: SlotStatus.active,
      connectionStatus: PlayerConnectionStatus.offline,
    }))
    const changed = await update(
      { number: game.number, state: { $in: [GameState.launching, GameState.started] } },
      { $push: { slots: { $each: slots } } },
    )
    await assignActiveGame(game, additions)
    return changed
  })
}

async function assignActiveGame(game: GameModel, players: AddPlayers): Promise<void> {
  const conflict = await collections.players.findOne({
    steamId: { $in: players.map(player => player.steamId) },
    activeGame: { $exists: true, $ne: game.number },
  })
  if (conflict) throw errors.conflict(`player ${conflict.steamId} already has an active game`)
  await collections.players.updateMany(
    { steamId: { $in: players.map(player => player.steamId) } },
    { $set: { activeGame: game.number } },
  )
}
