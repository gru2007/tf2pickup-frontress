import { secondsToMilliseconds } from 'date-fns'
import { delay } from 'es-toolkit'
import { collections } from '../database/collections'
import { GameState, type GameNumber } from '../database/models/game.model'
import { logger } from '../logger'
import { assignGameServer } from '../games/assign-game-server'
import { configure } from '../games/rcon/configure'

const launches = new Map<GameNumber, Promise<void>>()

export function launchGame(gameNumber: GameNumber): void {
  if (launches.has(gameNumber)) return
  const launch = doLaunch(gameNumber).finally(() => launches.delete(gameNumber))
  launches.set(gameNumber, launch)
}

async function doLaunch(gameNumber: GameNumber): Promise<void> {
  for (;;) {
    const game = await collections.games.findOne({ number: gameNumber })
    if (!game || [GameState.launching, GameState.started, GameState.ended].includes(game.state))
      return
    try {
      if (!game.gameServer) await assignGameServer(gameNumber, { retries: 3 })
      await configure(gameNumber)
      const configured = await collections.games.findOne(
        { number: gameNumber },
        { projection: { state: 1 } },
      )
      if (configured?.state === GameState.launching) return
    } catch (error) {
      logger.warn({ error, gameNumber }, 'Frontress game is waiting for a game server')
    }
    await delay(secondsToMilliseconds(15))
  }
}
