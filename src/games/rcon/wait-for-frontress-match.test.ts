import { describe, expect, it, vi } from 'vitest'
import type { Rcon } from './with-rcon'
import { waitForFrontressMatch } from './wait-for-frontress-match'

const matchId = 'c86aa62fd05a3521'
const roster = '76561198655427488:2,76561198317961869:3'

describe('waitForFrontressMatch', () => {
  it('waits until the dedicated server admits the complete roster', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(`TFMM_MATCH_READY_PENDING ${matchId} waiting_for_76561198655427488`)
      .mockResolvedValueOnce(`TFMM_MATCH_READY_OK ${matchId}`)

    await waitForFrontressMatch({
      rcon: { send } as Rcon,
      matchId,
      map: 'cp_cargo',
      roster,
      interval: 0,
      timeout: 100,
    })

    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenCalledWith(`tf_mm_match_ready ${matchId} "cp_cargo" "${roster}"`)
  })

  it('fails closed on a permanent admission error', async () => {
    const send = vi
      .fn()
      .mockResolvedValue(`TFMM_MATCH_READY_FAILED ${matchId} roster_gate_disabled`)

    await expect(
      waitForFrontressMatch({
        rcon: { send } as Rcon,
        matchId,
        map: 'cp_cargo',
        roster,
        interval: 0,
        timeout: 100,
      }),
    ).rejects.toThrow('roster_gate_disabled')
  })

  it('rejects an old dedicated binary instead of assigning players early', async () => {
    const send = vi.fn().mockResolvedValue('Unknown command "tf_mm_match_ready"')

    await expect(
      waitForFrontressMatch({
        rcon: { send } as Rcon,
        matchId,
        map: 'cp_cargo',
        roster,
        interval: 0,
        timeout: 100,
      }),
    ).rejects.toThrow('lacks tf_mm_match_ready')
  })

  it('rejects malformed admission data without contacting SRCDS', async () => {
    const send = vi.fn()

    await expect(
      waitForFrontressMatch({
        rcon: { send } as Rcon,
        matchId: 'fedcba9876543210',
        map: 'cp_cargo',
        roster: 'not-a-roster',
      }),
    ).rejects.toThrow('invalid Frontress admission data')
    expect(send).not.toHaveBeenCalled()
  })
})
