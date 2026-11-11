import { describe, expect, it } from 'vitest'
import { matchKind } from './match-kind'

describe('matchKind()', () => {
  it('trusts the kind the GC sends', () => {
    expect(matchKind({ kind: 'war', match_group: 7 })).toBe('war')
    expect(matchKind({ kind: 'ranked', match_group: 7 })).toBe('ranked')
    expect(matchKind({ kind: 'casual', match_group: 7, campaign: 'x' })).toBe('casual')
  })

  it('reads old archives by their campaign and group', () => {
    expect(matchKind({ match_group: 7, campaign: 'rustvalley-1793800055' })).toBe('war')
    expect(matchKind({ match_group: 2 })).toBe('ranked')
    expect(matchKind({ match_group: 7 })).toBe('casual')
    expect(matchKind({ match_group: 7, kind: 'something-new' })).toBe('casual')
  })
})
