import { describe, expect, it } from 'vitest'
import { isCurrentServerMatch } from './is-current-server-match'

const status = `Team Frontress server backend
  active:      yes
  server id:   [G:1:123]
  lobby:       published
  match:       0123456789abcdef
  match group: 7
  state:       RUN
  seats:       2
  match info:  built
`

describe('isCurrentServerMatch', () => {
  it('matches only the published lobby for the requested match', () => {
    expect(isCurrentServerMatch(status, '0123456789abcdef')).toBe(true)
    expect(isCurrentServerMatch(status, '0123456789abcdee')).toBe(false)
  })

  it('is case-insensitive for hexadecimal IDs', () => {
    expect(isCurrentServerMatch(status.toUpperCase(), '0123456789ABCDEF')).toBe(true)
  })

  it('refuses to clean a server whose lobby has gone away', () => {
    expect(isCurrentServerMatch(status.replace('published', 'none'), '0123456789abcdef')).toBe(false)
    expect(isCurrentServerMatch('Unknown command "tf_mm_server_status"', '0123456789abcdef')).toBe(false)
  })

  it('rejects malformed IDs and arbitrary console text', () => {
    expect(isCurrentServerMatch(status, '')).toBe(false)
    expect(isCurrentServerMatch(status, '0;quit')).toBe(false)
    expect(isCurrentServerMatch('match: 0123456789abcdef extra\nlobby: published', '0123456789abcdef')).toBe(false)
  })
})
