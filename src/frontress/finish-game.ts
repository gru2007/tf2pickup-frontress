import { collections } from '../database/collections'
import { GameEndedReason, GameEventType } from '../database/models/game-event.model'
import { SlotStatus } from '../database/models/game-slot.model'
import { GameKind, GameState } from '../database/models/game.model'
import { errors } from '../errors'
import { events } from '../events'
import { forceEnd } from '../games/force-end'
import { update } from '../games/update'
import type { MatchResult } from './schemas/match-result'

export async function finishGame(externalMatchId: string, result: MatchResult) {
  const existing = await collections.games.findOne({
    kind: GameKind.frontress,
    'frontress.externalMatchId': externalMatchId,
  })
  if (!existing) throw errors.notFound('Frontress game not found')
  if ([GameState.ended, GameState.interrupted].includes(existing.state)) return existing
  if (result.aborted) return await forceEnd(existing.number, 'bot')

  await collections.gamesSubstituteRequests.deleteMany({ gameNumber: existing.number })
  try {
    const game = await update(
      {
        number: existing.number,
        state: { $in: [GameState.launching, GameState.started] },
      },
      {
        $set: {
          state: GameState.ended,
          score: {
            red: result.redScore,
            blu: result.bluScore,
          },
          'slots.$[slot].status': SlotStatus.active,
        },
        $push: {
          events: {
            at: new Date(),
            event: GameEventType.gameEnded,
            reason: GameEndedReason.matchEnded,
          },
        },
      },
      {
        arrayFilters: [{ 'slot.status': { $eq: SlotStatus.waitingForSubstitute } }],
      },
    )
    events.emit('game:ended', { game })
    return game
  } catch (error) {
    const final = await collections.games.findOne({ number: existing.number })
    if (final && [GameState.ended, GameState.interrupted].includes(final.state)) return final
    throw error
  }
}
