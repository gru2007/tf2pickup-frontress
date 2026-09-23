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
      // launching counts, not just started. A Frontress game reaches launching
      // the moment the game server acknowledges the match, and only becomes
      // started when somebody actually joins -- so a match whose players never
      // arrived, because the server turned them away or because its serveme
      // reservation died under it, sits in launching. Leaving that to the
      // FRONTRESS_MAX_MATCH_SECONDS cap pins every one of its players'
      // activeGame for three hours, and the gateway keeps handing them the
      // connect string of a server that is gone instead of queueing them.
      if ([GameState.launching, GameState.started].includes(game.state) && isIdle(game, now)) {
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

  // Nobody has ever been on this server, so there is no presence event to
  // measure from. Measure from the moment the server was declared ready
  // instead: "the players never arrived" is exactly the case that has to end
  // here, and requiring a presence event meant it never did.
  const idleSince =
    lastPresenceEvent?.at.getTime() ??
    game.events.findLast(event => event.event === GameEventType.gameServerInitialized)?.at.getTime()

  return (
    idleSince !== undefined &&
    now - idleSince >= secondsToMilliseconds(environment.FRONTRESS_IDLE_END_SECONDS)
  )
}
