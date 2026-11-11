import { hoursToMilliseconds, secondsToMilliseconds } from 'date-fns'
import { environment } from '../environment'
import { logger } from '../logger'
import type { SteamId64 } from '../shared/types/steam-id-64'
import { defaultPlayerAvatar } from '../shared/default-player-avatar'

export interface PlayerSummary {
  steamId: SteamId64
  name: string | undefined
  avatar: { small: string; medium: string; large: string }
}

interface Cached {
  summary: PlayerSummary
  at: number
}

const cache = new Map<SteamId64, Cached>()
const ttl = hoursToMilliseconds(6)
const maxCached = 20000

// Names and avatars from Steam, for the players the coordinator knows only by
// SteamID (and the name the game last told it). Without STEAM_API_KEY, or
// when Steam is down, players get the default avatar.
export async function getPlayerSummaries(
  steamIds: SteamId64[],
): Promise<Map<SteamId64, PlayerSummary>> {
  const now = Date.now()
  const out = new Map<SteamId64, PlayerSummary>()
  const missing: SteamId64[] = []
  for (const id of new Set(steamIds)) {
    const hit = cache.get(id)
    if (hit && now - hit.at < ttl) {
      out.set(id, hit.summary)
    } else {
      missing.push(id)
    }
  }

  if (missing.length > 0 && environment.STEAM_API_KEY) {
    for (let i = 0; i < missing.length; i += 100) {
      const batch = missing.slice(i, i + 100)
      try {
        const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/')
        url.searchParams.set('key', environment.STEAM_API_KEY)
        url.searchParams.set('steamids', batch.join(','))
        const response = await fetch(url, { signal: AbortSignal.timeout(secondsToMilliseconds(5)) })
        if (!response.ok) {
          throw new Error(`Steam answered ${response.status}`)
        }
        const body = (await response.json()) as {
          response?: {
            players?: {
              steamid: string
              personaname?: string
              avatar?: string
              avatarmedium?: string
              avatarfull?: string
            }[]
          }
        }
        for (const p of body.response?.players ?? []) {
          const summary: PlayerSummary = {
            steamId: p.steamid as SteamId64,
            name: p.personaname,
            avatar: {
              small: p.avatar ?? defaultPlayerAvatar.small,
              medium: p.avatarmedium ?? defaultPlayerAvatar.medium,
              large: p.avatarfull ?? defaultPlayerAvatar.large,
            },
          }
          if (cache.size >= maxCached) {
            cache.clear()
          }
          cache.set(summary.steamId, { summary, at: now })
          out.set(summary.steamId, summary)
        }
      } catch (error) {
        logger.warn({ error }, 'could not fetch Steam player summaries')
        break
      }
    }
  }

  for (const id of steamIds) {
    if (!out.has(id)) {
      out.set(id, { steamId: id, name: undefined, avatar: defaultPlayerAvatar })
    }
  }
  return out
}
