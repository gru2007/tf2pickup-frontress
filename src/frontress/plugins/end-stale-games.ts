import fp from 'fastify-plugin'
import { secondsToMilliseconds } from 'date-fns'
import { collections } from '../../database/collections'
import { GameEventType } from '../../database/models/game-event.model'
import { PlayerConnectionStatus } from '../../database/models/game-slot.model'
import { GameKind, GameState, type GameModel } from '../../database/models/game.model'
import { environment } from '../../environment'
import { forceEnd } from '../../games/force-end'
import { logger } from '../../logger'

const checkInterval = secondsToMilliseconds(30)

export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async app => {
    let running = false
    const timer = setInterval(() => {
      if (running) return
      running = true
      endStaleGames()
        .catch((error: unknown) => {
          logger.error({ error }, 'failed checking stale Frontress games')
        })
        .finally(() => {
          running = false
        })
    }, checkInterval)
    timer.unref()
    app.addHook('onClose', () => {
      clearInterval(timer)
    })
  },
  { name: 'end stale Frontress games' },
)

async function endStaleGames(): Promise<void> {
  const games = await collections.games
    .find({
      kind: GameKind.frontress,
      state: {
        $in: [GameState.created, GameState.configuring, GameState.launching, GameState.started],
      },
    })
    .toArray()
  const now = Date.now()
  for (const game of games) {
    try {
      const createdAt = game.events[0].at.getTime()
      if (now - createdAt >= secondsToMilliseconds(environment.FRONTRESS_MAX_MATCH_SECONDS)) {
        await forceEnd(game.number, 'bot')
        continue
      }
      if (game.state === GameState.started && isIdle(game, now)) {
        await forceEnd(game.number, 'bot')
      }
    } catch (error: unknown) {
      logger.error({ error, game: game.number }, 'failed ending stale Frontress game')
    }
  }
}

function isIdle(game: GameModel, now: number): boolean {
  if (
    game.slots.some(slot =>
      [PlayerConnectionStatus.joining, PlayerConnectionStatus.connected].includes(
        slot.connectionStatus,
      ),
    )
  ) {
    return false
  }
  const lastPresenceEvent = game.events.findLast(event =>
    [
      GameEventType.gameStarted,
      GameEventType.playerJoinedGameServer,
      GameEventType.playerJoinedGameServerTeam,
      GameEventType.playerLeftGameServer,
    ].includes(event.event),
  )
  return (
    lastPresenceEvent !== undefined &&
    now - lastPresenceEvent.at.getTime() >=
      secondsToMilliseconds(environment.FRONTRESS_IDLE_END_SECONDS)
  )
}
