import { randomUUID } from 'node:crypto'
import type { z } from 'zod'
import { collections } from '../database/collections'
import { PlayerConnectionStatus, SlotStatus } from '../database/models/game-slot.model'
import {
  FrontressAdmissionState,
  GameKind,
  GameState,
  type FrontressAdmission,
  type GameModel,
} from '../database/models/game.model'
import { errors } from '../errors'
import { createMutex } from '../games/create-mutex'
import { update } from '../games/update'
import { frontressGameClass } from '../shared/types/game-class-name'
import type { GameSlotId } from '../shared/types/game-slot-id'
import { Tf2ClassName } from '../shared/types/tf2-class-name'
import { Tf2Team } from '../shared/types/tf2-team'
import { applyAdmission } from './apply-admission'
import { assertPlayersAvailable } from './assert-players-available'
import { ensurePlayers } from './ensure-players'
import { addPlayersSchema } from './schemas/add-players'

type AddPlayers = z.infer<typeof addPlayersSchema>['players']

export async function addPlayers(
  externalMatchId: string,
  additions: AddPlayers,
): Promise<GameModel> {
  const reserved = await createMutex.runExclusive(async () => {
    const game = await collections.games.findOne({ 'frontress.externalMatchId': externalMatchId })
    if (game?.kind !== GameKind.frontress || !game.frontress) {
      throw errors.notFound('Frontress game not found')
    }
    if (![GameState.launching, GameState.started].includes(game.state)) {
      throw errors.conflict('Frontress game is not accepting players')
    }

    const unique = new Set(additions.map(player => player.steamId))
    if (unique.size !== additions.length) throw errors.badRequest('duplicate player')

    const applied = new Map(game.slots.map(slot => [slot.player, slot]))
    const pendingAdmissions = (game.frontress.admissions ?? []).filter(
      admission => admission.state === FrontressAdmissionState.pending,
    )
    const pending = new Map(
      pendingAdmissions.flatMap(admission => admission.slots.map(slot => [slot.player, slot])),
    )
    const existing = additions.filter(
      player => applied.has(player.steamId) || pending.has(player.steamId),
    )
    if (existing.length === additions.length) {
      const teamsMatch = additions.every(player => {
        const slot = applied.get(player.steamId) ?? pending.get(player.steamId)
        return slot?.team === player.team
      })
      if (!teamsMatch) throw errors.conflict('player already exists on another team')
      await assignActiveGame(game, additions)
      const admission = pendingAdmissions.find(value =>
        additions.every(player => value.slots.some(slot => slot.player === player.steamId)),
      )
      return { game, admissionId: admission?.id }
    }
    if (existing.length > 0) throw errors.conflict('request mixes existing and new players')

    const reservedSlots = [
      ...game.slots,
      ...pendingAdmissions.flatMap(admission => admission.slots),
    ]
    if (reservedSlots.length + additions.length > game.frontress.maxPlayers) {
      throw errors.conflict('Frontress game is full')
    }
    const teamCap = game.frontress.maxPlayers / 2
    for (const team of Object.values(Tf2Team)) {
      const count = reservedSlots.filter(slot => slot.team === team).length
      const added = additions.filter(player => player.team === team).length
      if (count + added > teamCap) throw errors.conflict(`${team} team is full`)
    }

    await ensurePlayers(additions)
    await assertPlayersAvailable(
      additions.map(player => player.steamId),
      game.number,
    )
    const counts = {
      [Tf2Team.red]: reservedSlots.filter(slot => slot.team === Tf2Team.red).length,
      [Tf2Team.blu]: reservedSlots.filter(slot => slot.team === Tf2Team.blu).length,
    }
    const admission: FrontressAdmission = {
      id: randomUUID(),
      state: FrontressAdmissionState.pending,
      requestedAt: new Date(),
      slots: additions.map(player => ({
        id: `${player.team}-${frontressGameClass}-${++counts[player.team]}` as GameSlotId,
        player: player.steamId,
        team: player.team,
        gameClass: Tf2ClassName.scout,
        ratingClass: frontressGameClass,
        status: SlotStatus.active,
        connectionStatus: PlayerConnectionStatus.offline,
      })),
    }
    const changed = await update(
      { number: game.number, state: { $in: [GameState.launching, GameState.started] } },
      { $push: { 'frontress.admissions': admission } },
    )
    await assignActiveGame(changed, additions)
    return { game: changed, admissionId: admission.id }
  })

  if (!reserved.admissionId) return reserved.game
  return await applyAdmission(reserved.game.number, reserved.admissionId)
}

async function assignActiveGame(game: GameModel, players: AddPlayers): Promise<void> {
  await assertPlayersAvailable(
    players.map(player => player.steamId),
    game.number,
  )
  await collections.players.updateMany(
    { steamId: { $in: players.map(player => player.steamId) } },
    { $set: { activeGame: game.number } },
  )
}
