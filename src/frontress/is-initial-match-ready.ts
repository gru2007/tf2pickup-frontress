import { isCurrentServerMatch } from './is-current-server-match'

// TFMM_MATCH_BEGIN_OK means the RCON command published a lobby, NOT that
// CTFGCServerSystem has built the match and installed its SteamID roster gate.
// The latter is what SteamIDAllowedToConnect consults when users connect.
export function isInitialMatchReady(status: string, matchId: string, expectedSeats: number): boolean {
  if (!isCurrentServerMatch(status, matchId)) return false
  if (!/^\s*match info:\s*built\s*$/im.test(status)) return false
  const seats = status.match(/^\s*seats:\s*(\d+)\s*$/im)
  return seats !== null && Number(seats[1]) >= expectedSeats
}
