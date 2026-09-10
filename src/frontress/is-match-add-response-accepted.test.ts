import { describe, expect, it } from 'vitest'
import { isMatchAddResponseAccepted } from './is-match-add-response-accepted'

describe('isMatchAddResponseAccepted', () => {
  const matchId = '0123456789abcdef'

  it.each(['TFMM_MATCH_ADD_OK 0123456789abcdef 1', 'TFMM_MATCH_ADD_OK 0123456789abcdef 0'])(
    'accepts %s',
    response => expect(isMatchAddResponseAccepted(response, matchId)).toBe(true),
  )

  it.each([
    '',
    'TFMM_MATCH_ADD_FAILED 0123456789abcdef',
    'TFMM_MATCH_ADD_PLAIN 0123456789abcdef',
    'TFMM_MATCH_ADD_OK fedcba9876543210 1',
    'prefix TFMM_MATCH_ADD_OK 0123456789abcdef 1 suffix',
  ])('rejects %s', response => {
    expect(isMatchAddResponseAccepted(response, matchId)).toBe(false)
  })
})
