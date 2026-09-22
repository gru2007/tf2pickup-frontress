import { collections } from '../database/collections'
import {
  FrontressAdmissionState,
  GameState,
  type GameModel,
  type GameNumber,
} from '../database/models/game.model'
import { errors } from '../errors'
import { update } from '../games/update'
import type { RconCommand } from '../shared/types/rcon-command'
import { Tf2Team } from '../shared/types/tf2-team'
import { withRcon } from '../games/rcon/with-rcon'
import { isMatchAddResponseAccepted } from './is-match-add-response-accepted'
import { assertPlayersAvailable } from './assert-players-available'
import { waitForFrontressMatch } from '../games/rcon/wait-for-frontress-match'

const applying = new Map<string, Promise<GameModel>>()

export function applyAdmission(gameNumber: GameNumber, admissionId: string): Promise<GameModel> {
  const key = `${gameNumber}:${admissionId}`
  const running = applying.get(key)
  if (running) return running
  const operation = apply(gameNumber, admissionId).finally(() => applying.delete(key))
  applying.set(key, operation)
  return operation
}

async function apply(gameNumber: GameNumber, admissionId: string): Promise<GameModel> {
  const game = await collections.games.findOne({ number: gameNumber })
  const admission = game?.frontress?.admissions?.find(value => value.id === admissionId)
  if (!game || !admission) throw errors.notFound('Frontress admission not found')
  if (admission.state === FrontressAdmissionState.applied) return game
  if (![GameState.launching, GameState.started].includes(game.state)) {
    throw errors.conflict('Frontress game is not accepting players')
  }

  const steamIds = admission.slots.map(slot => slot.player)
  await assertPlayersAvailable(steamIds, game.number)
  await collections.players.updateMany(
    { steamId: { $in: steamIds } },
    { $set: { activeGame: game.number } },
  )

  const roster = admission.slots
    .map(slot => `${slot.player}:${slot.team === Tf2Team.red ? 2 : 3}`)
    .join(',')
  const command = `tf_mm_match_add "${game.frontress!.externalMatchId}" "${roster}"` as RconCommand
  const response = await withRcon(game, async ({ rcon }) => {
    const result = await rcon.send(command)
    if (isMatchAddResponseAccepted(result, game.frontress!.externalMatchId)) {
      await waitForFrontressMatch({
        rcon,
        matchId: game.frontress!.externalMatchId,
        map: game.map,
        roster,
      })
    }
    return result
  })
  if (!isMatchAddResponseAccepted(response, game.frontress!.externalMatchId)) {
    throw errors.badGateway('game server did not acknowledge tf_mm_match_add')
  }

  try {
    return await update(
      {
        number: game.number,
        state: { $in: [GameState.launching, GameState.started] },
        'frontress.admissions': {
          $elemMatch: { id: admissionId, state: FrontressAdmissionState.pending },
        },
      },
      {
        $push: { slots: { $each: admission.slots } },
        $set: {
          'frontress.admissions.$[admission].state': FrontressAdmissionState.applied,
          'frontress.admissions.$[admission].appliedAt': new Date(),
        },
      },
      {
        arrayFilters: [
          { 'admission.id': admissionId, 'admission.state': FrontressAdmissionState.pending },
        ],
      },
    )
  } catch (error) {
    const current = await collections.games.findOne({ number: game.number })
    const currentAdmission = current?.frontress?.admissions?.find(value => value.id === admissionId)
    if (current && currentAdmission?.state === FrontressAdmissionState.applied) return current
    throw error
  }
}
