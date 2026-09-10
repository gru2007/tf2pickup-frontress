import { collections } from '../database/collections'
import { GameEndedReason, GameEventType } from '../database/models/game-event.model'
import { SlotStatus } from '../database/models/game-slot.model'
import { GameState, type GameNumber } from '../database/models/game.model'
import { events } from '../events'
import type { Bot } from '../shared/types/bot'
import type { SteamId64 } from '../shared/types/steam-id-64'
import { activityLog } from '../activity-log'
import { update } from './update'

export async function forceEnd(
  gameNumber: GameNumber,
  actor?: SteamId64 | Bot,
  reason = GameEndedReason.interrupted,
) {
  const existing = await collections.games.findOne({ number: gameNumber })
  if (!existing) throw new Error(`game ${gameNumber} not found`)
  if ([GameState.ended, GameState.interrupted].includes(existing.state)) return existing

  await collections.gamesSubstituteRequests.deleteMany({ gameNumber })
  try {
    const game = await update(
      {
        number: gameNumber,
        state: {
          $in: [GameState.created, GameState.configuring, GameState.launching, GameState.started],
        },
      },
      {
        $set: {
          state: GameState.interrupted,
          'slots.$[slot].status': SlotStatus.active,
        },
        $push: {
          events: {
            at: new Date(),
            event: GameEventType.gameEnded,
            reason,
            ...(actor && { actor }),
          },
        },
      },
      {
        arrayFilters: [
          {
            'slot.status': { $eq: SlotStatus.waitingForSubstitute },
          },
        ],
      },
    )
    await activityLog.record({
      type: 'game force-ended',
      gameNumber,
      ...(actor && { actor }),
    })
    events.emit('game:ended', { game })
    return game
  } catch (error) {
    const final = await collections.games.findOne({ number: gameNumber })
    if (final && [GameState.ended, GameState.interrupted].includes(final.state)) return final
    throw error
  }
}
