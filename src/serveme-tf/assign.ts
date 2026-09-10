import { GameServerProvider, type GameModel, type GameServer } from '../database/models/game.model'
import { client } from './client'
import { logger } from '../logger'
import { pickServer } from './pick-server'
import { errors } from '../errors'
import { GameKind } from '../database/models/game.model'
import { ensureMatchReservation } from './ensure-match-reservation'

export async function assign(game: GameModel, name?: string): Promise<GameServer> {
  if (!client) {
    throw errors.badRequest(`serveme.tf is disabled`)
  }

  const reservation =
    game.kind === GameKind.frontress
      ? await ensureMatchReservation(client, game, name)
      : await createReservation(game, name)
  logger.info(
    {
      reservation: {
        id: reservation.id,
        name: reservation.server.name,
        ipAndPort: reservation.server.ip_and_port,
      },
    },
    `reservation created`,
  )

  const sdr = reservation.sdr?.final ? reservation.sdr : null

  return {
    provider: GameServerProvider.servemeTf,
    id: reservation.id.toString(),
    name: reservation.server.name,
    address: sdr?.ip ?? reservation.server.ip,
    port: sdr?.port ?? reservation.server.port,
    logSecret: reservation.logSecret,

    ...(sdr && {
      stvAddress: sdr.ip,
      stvPort: sdr.tvPort,
    }),

    rcon: {
      address: reservation.server.ip,
      port: reservation.server.port,
      password: reservation.rcon,
    },
  }
}

async function createReservation(game: GameModel, name?: string) {
  const { servers } = await client!.findOptions()
  logger.debug({ servers }, 'serveme.tf servers listed')
  const serverId = await pickServer(servers, name)
  logger.debug({ serverId }, 'serveme.tf server selected')
  return await client!.create({
    serverId,
    enableDemosTf: true,
    enablePlugins: true,
    firstMap: game.map,
  })
}
