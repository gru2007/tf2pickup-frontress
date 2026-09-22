import { GameKind, type GameModel } from '../../database/models/game.model'
import { logger } from '../../logger'
import { environment } from '../../environment'
import { withRcon } from './with-rcon'

export async function cleanup(game: GameModel) {
  logger.info({ game }, `cleaning up after game #${game.number}...`)

  await withRcon(game, async ({ rcon }) => {
    await rcon.send(`logaddress_del ${environment.LOG_RELAY_ADDRESS}:${environment.LOG_RELAY_PORT}`)
    if (game.kind === GameKind.frontress) {
      await rcon.send('tf_mm_match_end returned')
      await rcon.send('sv_password ""')
      await rcon.send('sv_tags ""')
      await rcon.send('tf_match_emulation 0')
      await rcon.send('tf_mm_trusted 0')
      return
    }
    await rcon.send(`sm_game_player_delall`)
    await rcon.send(`sm_game_player_whitelist 0`)
  })

  logger.info({ game }, `server cleaned up`)
}
