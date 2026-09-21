import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameKind, GameState, type GameNumber } from '../database/models/game.model'

vi.mock('../database/collections', () => ({
  collections: {
    games: { findOne: vi.fn() },
    gamesSubstituteRequests: { deleteMany: vi.fn() },
  },
}))
vi.mock('../games/update', () => ({ update: vi.fn() }))
vi.mock('../games/force-end', () => ({ forceEnd: vi.fn() }))
vi.mock('../events', () => ({ events: { emit: vi.fn() } }))

import { collections } from '../database/collections'
import { events } from '../events'
import { forceEnd } from '../games/force-end'
import { update } from '../games/update'
import { finishGame } from './finish-game'

const number = 42 as GameNumber
const existing = {
  number,
  kind: GameKind.frontress,
  state: GameState.started,
  frontress: { externalMatchId: '0123456789abcdef' },
}

describe('finishGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(collections.games.findOne).mockResolvedValue(existing as never)
  })

  it('atomically persists a native GC score and emits normal cleanup', async () => {
    const ended = { ...existing, state: GameState.ended, score: { red: 5, blu: 3 } }
    vi.mocked(update).mockResolvedValue(ended as never)

    await expect(
      finishGame('0123456789abcdef', {
        redScore: 5,
        bluScore: 3,
        aborted: false,
        players: [],
      }),
    ).resolves.toBe(ended)

    expect(update).toHaveBeenCalledWith(
      { number, state: { $in: [GameState.launching, GameState.started] } },
      expect.objectContaining({
        $set: expect.objectContaining({ state: GameState.ended, score: { red: 5, blu: 3 } }),
      }),
      expect.any(Object),
    )
    expect(events.emit).toHaveBeenCalledWith('game:ended', { game: ended })
  })

  it('uses the interrupted lifecycle for an aborted match', async () => {
    const interrupted = { ...existing, state: GameState.interrupted }
    vi.mocked(forceEnd).mockResolvedValue(interrupted as never)

    await expect(
      finishGame('0123456789abcdef', {
        redScore: 0,
        bluScore: 0,
        aborted: true,
        players: [],
      }),
    ).resolves.toBe(interrupted)

    expect(forceEnd).toHaveBeenCalledWith(number, 'bot')
    expect(update).not.toHaveBeenCalled()
  })
})
