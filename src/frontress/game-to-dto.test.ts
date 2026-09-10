import { describe, expect, it } from 'vitest'
import { GameEventType } from '../database/models/game-event.model'
import { GameKind, GameState, type GameModel, type GameNumber } from '../database/models/game.model'
import { gameToDto } from './game-to-dto'

describe('gameToDto', () => {
  it('preserves durable lifecycle timestamps', () => {
    const createdAt = new Date('2026-09-10T08:00:00Z')
    const readyAt = new Date('2026-09-10T08:01:00Z')
    const startedAt = new Date('2026-09-10T08:02:00Z')
    const game = {
      number: 1 as GameNumber,
      map: 'koth_product_final',
      state: GameState.started,
      kind: GameKind.frontress,
      frontress: {
        externalMatchId: '0123456789abcdef',
        matchGroup: 7,
        maxPlayers: 24,
        serverConfig: '',
        matchEmulation: 1,
      },
      slots: [],
      events: [
        { event: GameEventType.gameCreated, at: createdAt },
        { event: GameEventType.gameServerInitialized, at: readyAt },
        { event: GameEventType.gameStarted, at: startedAt },
      ],
    } satisfies GameModel

    expect(gameToDto(game)).toMatchObject({
      createdAt: createdAt.toISOString(),
      readyAt: readyAt.toISOString(),
      startedAt: startedAt.toISOString(),
    })
  })
})
