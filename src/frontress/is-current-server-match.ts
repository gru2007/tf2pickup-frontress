// An old game's asynchronous cleanup must never reset a newly reserved match
// running on the same physical gameserver. Match identity is owned by SRCDS,
// not by the stale GameModel captured when the end event was emitted.
export function isCurrentServerMatch(status: string, matchId: string): boolean {
  if (!/^[0-9a-f]{16}$/i.test(matchId)) return false
  if (!/^\s*lobby:\s*published\s*$/im.test(status)) return false
  const match = status.match(/^\s*match:\s*([0-9a-f]{16})\s*$/im)
  return match !== null && match[1].toLowerCase() === matchId.toLowerCase()
}
