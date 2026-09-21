import { describe, expect, it } from 'vitest'
import { matchResultSchema } from './match-result'

describe('matchResultSchema', () => {
  it('accepts the native GC result shape', () => {
    expect(
      matchResultSchema.parse({
        redScore: 5,
        bluScore: 3,
        aborted: false,
        players: [{ steamId: '76561198000000001', team: 'red' }],
      }),
    ).toMatchObject({ redScore: 5, bluScore: 3, aborted: false })
  })

  it('rejects invalid scores and player identities', () => {
    expect(() =>
      matchResultSchema.parse({
        redScore: -1,
        bluScore: 0,
        aborted: false,
        players: [{ steamId: 'not-steam', team: 'red' }],
      }),
    ).toThrow()
  })
})
