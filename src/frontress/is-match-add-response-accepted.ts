export function isMatchAddResponseAccepted(response: string, matchId: string): boolean {
  return response
    .split(/\r?\n/)
    .map(line => line.trim())
    .some(line => new RegExp(`^TFMM_MATCH_ADD_OK ${matchId} \\d+$`).test(line))
}
