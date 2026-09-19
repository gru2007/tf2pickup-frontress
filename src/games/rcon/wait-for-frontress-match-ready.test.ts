import { describe, expect, it, vi } from 'vitest'
import { waitForFrontressMatchReady } from './wait-for-frontress-match-ready'

const matchId = 'c86aa62fd05a3521'
const roster = '76561198655427488:2,76561198317961869:3'
const begin = `tf_mm_match_begin "${matchId}" 7 "cp_cargo" "frontress_casual" "test_password" "${roster}" 24`
const beginOK = `TFMM_MATCH_BEGIN_OK ${matchId}`

describe('waitForFrontressMatchReady', () => {
  it('waits for the dedicated server to admit every assigned player', async () => {
    const send = vi.fn().mockResolvedValueOnce(`TFMM_MATCH_READY_PENDING ${matchId} waiting_for_reservations`)
      .mockResolvedValueOnce(`TFMM_MATCH_READY_OK ${matchId}`)

    await waitForFrontressMatchReady(begin, beginOK, send)

    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenCalledWith(`tf_mm_match_ready ${matchId} cp_cargo "${roster}"`)
  })

  it('fails closed if the game server rejects readiness', async () => {
    const send = vi.fn().mockResolvedValue(`TFMM_MATCH_READY_FAILED ${matchId} roster_gate_disabled`)
    await expect(waitForFrontressMatchReady(begin, beginOK, send)).rejects.toThrow('roster_gate_disabled')
  })

  it('fails closed when the dedicated binary has not been updated', async () => {
    const send = vi.fn().mockResolvedValue('Unknown command "tf_mm_match_ready"')
    await expect(waitForFrontressMatchReady(begin, beginOK, send)).rejects.toThrow('lacks tf_mm_match_ready')
  })

  it('does not hide the original match-begin error', async () => {
    const send = vi.fn()
    await waitForFrontressMatchReady(begin, `TFMM_MATCH_BEGIN_FAILED ${matchId}`, send)
    expect(send).not.toHaveBeenCalled()
  })

  it('does not accept malformed match commands', async () => {
    const send = vi.fn()
    await expect(waitForFrontressMatchReady('tf_mm_match_begin bad', beginOK, send)).rejects.toThrow('invalid tf_mm_match_begin')
    expect(send).not.toHaveBeenCalled()
  })
})
