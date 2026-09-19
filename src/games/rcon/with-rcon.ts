import { Rcon as RconClient } from 'rcon-client'
import { Mutex } from 'async-mutex'
import { type GameModel } from '../../database/models/game.model'
import { assertIsError } from '../../utils/assert-is-error'
import { logger } from '../../logger'
import { errors } from '../../errors'
import type { RconCommand } from '../../shared/types/rcon-command'

export interface Rcon {
  send: (command: RconCommand) => Promise<string>
}

// A serveme reservation can recycle the same SRCDS address immediately.
// Cleanup for an old match and configuration for a new match must never
// interleave: checking a match ID before cleanup alone has a TOCTOU race.
// Use the same lock for all RCON operations on that physical server.
const serverLocks = new Map<string, Mutex>()

export async function withRcon<T>(
  game: Pick<GameModel, 'number' | 'gameServer'>,
  callback: (args: { rcon: Rcon }) => Promise<T>,
): Promise<T> {
  logger.trace({ gameNumber: game.number }, `withRcon()`)
  if (game.gameServer === undefined) {
    throw errors.internalServerError(`gameServer is undefined`)
  }

  const { address, port, password } = game.gameServer.rcon
  const serverKey = `${address}:${port}`
  let lock = serverLocks.get(serverKey)
  if (!lock) {
    lock = new Mutex()
    serverLocks.set(serverKey, lock)
  }

  return await lock.runExclusive(async () => {
    let rcon: RconClient | undefined
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

      return await callback({
        rcon: {
          send: async (command: RconCommand) => {
            const ret = await rcon!.send(command)
            if (!rcon!.authenticated) {
              await rcon!.connect()
            }
            return ret
          },
        },
      })
    } finally {
      await rcon?.end()
    }
  })
}
