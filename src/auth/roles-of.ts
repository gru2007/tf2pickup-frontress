import { environment } from '../environment'
import type { SteamId64 } from '../shared/types/steam-id-64'
import { PlayerRole } from './player-role'

// Roles come from the site's configuration (ADMINS, SUPER_USERS): the
// coordinator trusts this site's admin key, and the site decides who uses it.
export function rolesOf(steamId: SteamId64): PlayerRole[] {
  if (environment.SUPER_USERS.includes(steamId)) {
    return [PlayerRole.superUser, PlayerRole.admin]
  }
  if (environment.ADMINS.includes(steamId)) {
    return [PlayerRole.admin]
  }
  return []
}
