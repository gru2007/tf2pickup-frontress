import { secondsToMilliseconds } from 'date-fns'
import { delay } from 'es-toolkit'
import type { RconCommand } from '../../shared/types/rcon-command'
import type { Rcon } from './with-rcon'

const pollInterval = secondsToMilliseconds(1)
const readyTimeout = secondsToMilliseconds(45)

// BEGIN_OK only confirms that SRCDS published a lobby. The stock strict join
// gate reads CMatchInfo, which is populated asynchronously while the map is
// changing. Keep the assignment private until that exact gate accepts every
// SteamID from the initial roster.
export async function waitForFrontressMatch(args: {
  rcon: Rcon
  matchId: string
  map: string
  roster: string
  signal?: AbortSignal | undefined
  interval?: number | undefined
  timeout?: number | undefined
}): Promise<void> {
  const {
    rcon,
    matchId,
    map,
    roster,
    signal,
    interval = pollInterval,
    timeout = readyTimeout,
  } = args
  if (
    !/^[0-9a-f]{1,16}$/i.test(matchId) ||
    !/^[a-z0-9_./-]+$/i.test(map) ||
    !/^\d+:[23](,\d+:[23])*$/.test(roster)
  ) {
    throw new Error(`invalid Frontress admission data for match ${matchId}`)
  }

  const probe: RconCommand = `tf_mm_match_ready ${matchId} "${map}" "${roster}"`
  const deadline = Date.now() + timeout
  let lastStatus = 'no readiness response'

  while (Date.now() <= deadline) {
    if (signal?.aborted) throw new Error(`${signal.reason}`)

    const response = await rcon.send(probe)
    const lines = response.split(/\r?\n/).map(line => line.trim())
    if (lines.includes(`TFMM_MATCH_READY_OK ${matchId}`)) return

    const failure = lines.find(line => line.startsWith('TFMM_MATCH_READY_FAILED'))
    if (failure) throw new Error(`match ${matchId}: ${failure}`)
    if (response.toLowerCase().includes('unknown command')) {
      throw new Error(
        `match ${matchId}: dedicated server lacks tf_mm_match_ready; update the game server image`,
      )
    }

    lastStatus =
      lines.find(line => line.startsWith(`TFMM_MATCH_READY_PENDING ${matchId}`)) ??
      lines.find(line => line.length > 0) ??
      lastStatus
    await delay(interval)
  }

  throw new Error(`match ${matchId}: admission readiness timed out (${lastStatus})`)
}
