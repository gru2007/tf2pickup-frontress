import type { SteamId64 } from '../../shared/types/steam-id-64'
import type { PlayerRole } from '../player-role'

export interface User {
  player: {
    steamId: SteamId64
    name: string
    avatar: { medium: string }
    roles: PlayerRole[]
  }
}
