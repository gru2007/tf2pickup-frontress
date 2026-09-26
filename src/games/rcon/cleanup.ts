import { GameKind, type GameModel } from '../../database/models/game.model'
import { logger } from '../../logger'
import { environment } from '../../environment'
import { isCurrentServerMatch } from '../../frontress/is-current-server-match'
import { withRcon } from './with-rcon'

export async function cleanup(game: GameModel) {
  logger.info({ game }, `cleaning up after game #${game.number}...`)

  // A match can expire before serveme has assigned a server. There is no
  // server to clean in that case; withRcon would otherwise throw a 500.
  if (!game.gameServer) {
    logger.info({ gameNumber: game.number }, 'skipping cleanup: no game server was assigned')
    return
  }

  await withRcon(game, async ({ rcon }) => {
    if (game.kind === GameKind.frontress) {
      const matchId = game.frontress?.externalMatchId
      // serveme can hand the same machine to a second match before the old
      // game's asynchronous cleanup runs. Never clear its password, tags,
      // lobby or log relay unless SRCDS still hosts OUR match.
      const status = await rcon.send('tf_mm_server_status')
      if (!matchId || !isCurrentServerMatch(status, matchId)) {
        logger.warn(
          { gameNumber: game.number, matchId },
          'skipping stale cleanup: server no longer hosts this match',
        )
        return
      }

      await rcon.send(`logaddress_del ${environment.LOG_RELAY_ADDRESS}:${environment.LOG_RELAY_PORT}`)
      await rcon.send('tf_mm_match_end returned')
      await rcon.send('sv_password ""')
      await rcon.send('sv_tags ""')
      await rcon.send('tf_match_emulation 0')
      await rcon.send('tf_mm_trusted 0')
      return
    }

    await rcon.send(`logaddress_del ${environment.LOG_RELAY_ADDRESS}:${environment.LOG_RELAY_PORT}`)
    await rcon.send('sm_game_player_delall')
    await rcon.send('sm_game_player_whitelist 0')
  })

  logger.info({ game }, `server cleaned up`)
}
