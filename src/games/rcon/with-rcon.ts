import { Rcon as RconClient } from 'rcon-client'
import { type GameModel } from '../../database/models/game.model'
import { assertIsError } from '../../utils/assert-is-error'
import { logger } from '../../logger'
import { errors } from '../../errors'
import type { RconCommand } from '../../shared/types/rcon-command'
import { waitForFrontressMatchReady } from './wait-for-frontress-match-ready'

export interface Rcon {
  send: (command: RconCommand) => Promise<string>
}

export async function withRcon<T>(
  game: Pick<GameModel, 'number' | 'gameServer'>,
  callback: (args: { rcon: Rcon }) => Promise<T>,
): Promise<T> {
  logger.trace({ gameNumber: game.number }, `withRcon()`)
  if (game.gameServer === undefined) {
    throw errors.internalServerError(`gameServer is undefined`)
  }

  let rcon: RconClient | undefined
  const { address, port, password } = game.gameServer.rcon

  try {
    rcon = await RconClient.connect({
      host: address,
      port: Number(port),
      password: password,
      timeout: 30000,
    })
    rcon.on('error', error => {
      assertIsError(error)
      logger.error(error, `game #${game.number}: rcon error`)
    })

    const sendRaw = async (command: string): Promise<string> => {
      const result = await rcon!.send(command)
      if (!rcon!.authenticated) {
        await rcon!.connect()
      }
      return result
    }

    return await callback({
      rcon: {
        send: async (command: RconCommand) => {
          const result = await sendRaw(command)
          // Publishing a lobby is not the same as reserving each player's
          // CMatchInfo seat. Never return the begin acknowledgement to
          // configure.ts until the dedicated server's strict gate will admit
          // the complete initial roster. That keeps the game in configuring
          // and prevents the coordinator from assigning clients prematurely.
          if (command.startsWith('tf_mm_match_begin ')) {
            await waitForFrontressMatchReady(command, result, sendRaw)
          }
          return result
        },
      },
    })
  } finally {
    await rcon?.end()
  }
}
