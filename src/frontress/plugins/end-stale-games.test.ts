import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { secondsToMilliseconds } from 'date-fns'

const games: unknown[] = []

vi.mock('../../database/collections', () => ({
  collections: {
    games: {
      find: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue(games) })),
    },
  },
}))

vi.mock('../../games/force-end', () => ({
  forceEnd: vi.fn(),
}))

vi.mock('../../environment', () => ({
  environment: {
    FRONTRESS_IDLE_END_SECONDS: 300,
    FRONTRESS_MAX_MATCH_SECONDS: 10800,
  },
}))

vi.mock('../../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import plugin from './end-stale-games'
import { forceEnd } from '../../games/force-end'
import { GameEventType } from '../../database/models/game-event.model'
import { PlayerConnectionStatus } from '../../database/models/game-slot.model'
import { GameKind, GameState } from '../../database/models/game.model'

const checkInterval = secondsToMilliseconds(30)

// The reaper only runs on its own timer, so a test has to start it and then
// move the clock. Registering it against a stand-in for the fastify instance
// is enough: it only uses addHook.
async function runReaper() {
  const app = { addHook: vi.fn() }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (plugin as any)(app, {})
  await vi.advanceTimersByTimeAsync(checkInterval)
}

function frontressGame(overrides: Record<string, unknown>) {
  return {
    number: 13,
    kind: GameKind.frontress,
    state: GameState.launching,
    slots: [{ player: '76561198655427488', connectionStatus: PlayerConnectionStatus.offline }],
    events: [{ at: new Date(), event: GameEventType.gameCreated }],
    ...overrides,
  }
}

describe('end stale Frontress games', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-23T12:00:00Z'))
    games.length = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ends a launching game nobody ever joined', async () => {
    const createdAt = new Date('2026-09-23T11:50:00Z')
    const readyAt = new Date('2026-09-23T11:51:00Z')
    games.push(
      frontressGame({
        state: GameState.launching,
        events: [
          { at: createdAt, event: GameEventType.gameCreated },
          { at: readyAt, event: GameEventType.gameServerInitialized },
        ],
      }),
    )

    await runReaper()

    expect(forceEnd).toHaveBeenCalledWith(13, 'bot')
  })

  it('leaves a launching game alone while the server is still fresh', async () => {
    const createdAt = new Date('2026-09-23T11:59:00Z')
    const readyAt = new Date('2026-09-23T11:59:30Z')
    games.push(
      frontressGame({
        state: GameState.launching,
        events: [
          { at: createdAt, event: GameEventType.gameCreated },
          { at: readyAt, event: GameEventType.gameServerInitialized },
        ],
      }),
    )

    await runReaper()

    expect(forceEnd).not.toHaveBeenCalled()
  })

  it('leaves a game alone while somebody is on the server', async () => {
    games.push(
      frontressGame({
        state: GameState.launching,
        slots: [
          { player: '76561198655427488', connectionStatus: PlayerConnectionStatus.connected },
        ],
        events: [
          { at: new Date('2026-09-23T11:00:00Z'), event: GameEventType.gameCreated },
          { at: new Date('2026-09-23T11:01:00Z'), event: GameEventType.gameServerInitialized },
        ],
      }),
    )

    await runReaper()

    expect(forceEnd).not.toHaveBeenCalled()
  })

  it('still ends a started game that emptied out', async () => {
    games.push(
      frontressGame({
        state: GameState.started,
        events: [
          { at: new Date('2026-09-23T11:00:00Z'), event: GameEventType.gameCreated },
          { at: new Date('2026-09-23T11:01:00Z'), event: GameEventType.gameServerInitialized },
          { at: new Date('2026-09-23T11:02:00Z'), event: GameEventType.gameStarted },
          { at: new Date('2026-09-23T11:40:00Z'), event: GameEventType.playerLeftGameServer },
        ],
      }),
    )

    await runReaper()

    expect(forceEnd).toHaveBeenCalledWith(13, 'bot')
  })
})
