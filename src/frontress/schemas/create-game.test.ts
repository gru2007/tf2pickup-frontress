import { describe, expect, it } from 'vitest'
import { createGameSchema } from './create-game'

const game = {
  externalMatchId: 'match_1',
  map: 'koth_product_final',
  matchGroup: 7,
  maxPlayers: 4,
  serverConfig: 'frontress_casual',
  matchEmulation: 1,
  players: [
    { steamId: '76561198000000001', name: 'red', team: 'red' },
    { steamId: '76561198000000002', name: 'blu', team: 'blu' },
  ],
}

describe('createGameSchema', () => {
  it('accepts a balanced Frontress game', () => {
    expect(createGameSchema.safeParse(game).success).toBe(true)
  })

  it('rejects duplicate players', () => {
    expect(
      createGameSchema.safeParse({
        ...game,
        players: [game.players[0], game.players[0]],
      }).success,
    ).toBe(false)
  })

  it('rejects a team over its capacity', () => {
    expect(
      createGameSchema.safeParse({
        ...game,
        maxPlayers: 2,
        players: [game.players[0], { ...game.players[1], team: 'red' }],
      }).success,
    ).toBe(false)
  })
})
