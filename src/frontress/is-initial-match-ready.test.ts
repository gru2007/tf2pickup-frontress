import { describe, expect, it } from 'vitest'
import { isInitialMatchReady } from './is-initial-match-ready'

const status = `Team Frontress server backend
  active:      yes
  server id:   [G:1:123]
  lobby:       published
  match:       0123456789abcdef
  match group: 7
  map:         cp_cargo
  state:       SERVERSETUP
  seats:       2
  match info:  built
`

describe('isInitialMatchReady', () => {
  it('accepts the correct lobby after CMatchInfo has been constructed', () => {
    expect(isInitialMatchReady(status, '0123456789abcdef', 2)).toBe(true)
  })

  it('does not hand out an assignment with no real match info', () => {
    expect(isInitialMatchReady(status.replace('match info:  built', 'match info:  none -- server is not in a match'), '0123456789abcdef', 2)).toBe(false)
  })

  it('rejects a stale lobby or truncated roster', () => {
    expect(isInitialMatchReady(status, 'fedcba9876543210', 2)).toBe(false)
    expect(isInitialMatchReady(status, '0123456789abcdef', 3)).toBe(false)
    expect(isInitialMatchReady(status.replace('lobby:       published', 'lobby:       none'), '0123456789abcdef', 2)).toBe(false)
  })

  it('rejects unknown commands and missing metadata', () => {
    expect(isInitialMatchReady('Unknown command "tf_mm_server_status"', '0123456789abcdef', 2)).toBe(false)
    expect(isInitialMatchReady(status.replace('seats:       2\n', ''), '0123456789abcdef', 2)).toBe(false)
  })
})
