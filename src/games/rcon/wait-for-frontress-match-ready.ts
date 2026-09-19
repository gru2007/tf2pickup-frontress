import { setTimeout as delay } from 'node:timers/promises'

const READY_TIMEOUT_MS = 30_000
const READY_POLL_MS = 250

/**
 * A successful tf_mm_match_begin only means that the lobby was published.
 * The game server must still create its CMatchInfo, load the assigned map and
 * acknowledge each initial reservation before the strict admission gate
 * permits the coordinator's clients to join.
 *
 * This probe deliberately asks the game server's own
 * SteamIDAllowedToConnect() gate instead of duplicating admission policy in
 * tf2pickup. Fail closed if the dedicated binary lacks the probe.
 */
export async function waitForFrontressMatchReady(
  beginCommand: string,
  beginResponse: string,
  send: (command: string) => Promise<string>,
): Promise<void> {
  const args = [...beginCommand.matchAll(/"([^"]*)"|(\S+)/g)].map(
    match => match[1] ?? match[2] ?? '',
  )
  if (args.length !== 8 || args[0] !== 'tf_mm_match_begin') {
    throw new Error('invalid tf_mm_match_begin command: cannot check admissions')
  }

  const matchId = args[1] ?? ''
  const map = args[3] ?? ''
  const roster = args[6] ?? ''
  if (
    !/^[0-9a-f]{1,16}$/i.test(matchId) ||
    !/^[a-z0-9_./-]+$/i.test(map) ||
    !/^\d+:[23](,\d+:[23])*$/.test(roster)
  ) {
    throw new Error(`match ${matchId}: invalid map or initial roster for readiness check`)
  }

  const beginOK = `TFMM_MATCH_BEGIN_OK ${matchId}`
  if (!beginResponse.split(/\r?\n/).some(line => line.trim() === beginOK)) {
    // The caller already rejects an unsuccessful begin response; do not
    // disguise its original diagnostic with a probe error.
    return
  }

  const probe = `tf_mm_match_ready ${matchId} ${map} "${roster}"`
  const deadline = Date.now() + READY_TIMEOUT_MS
  let lastStatus = 'no readiness response'

  while (Date.now() < deadline) {
    const reply = await send(probe)
    const lines = reply.split(/\r?\n/).map(line => line.trim())
    if (lines.includes(`TFMM_MATCH_READY_OK ${matchId}`)) return

    const failure = lines.find(line => line.startsWith('TFMM_MATCH_READY_FAILED'))
    if (failure) throw new Error(`match ${matchId}: ${failure}`)

    if (reply.includes('Unknown command "tf_mm_match_ready"')) {
      throw new Error(
        `match ${matchId}: dedicated server lacks tf_mm_match_ready; update the game server image`,
      )
    }

    lastStatus =
      lines.find(line => line.startsWith(`TFMM_MATCH_READY_PENDING ${matchId}`)) ??
      (lines.find(line => line.length > 0) ?? lastStatus)
    await delay(READY_POLL_MS)
  }

  throw new Error(
    `match ${matchId}: admission readiness timed out after ${READY_TIMEOUT_MS}ms (${lastStatus})`,
  )
}
