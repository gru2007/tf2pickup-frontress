import { collections } from '../database/collections'
import type { SteamId64 } from '../shared/types/steam-id-64'

interface FrontressPlayer {
  steamId: SteamId64
  name: string
}

export async function ensurePlayers(players: FrontressPlayer[]): Promise<void> {
  const now = new Date()
  await Promise.all(
    players.map(async player => {
      await collections.players.updateOne(
        { steamId: player.steamId },
        {
          $setOnInsert: {
            steamId: player.steamId,
            name: player.name || player.steamId,
            joinedAt: now,
            avatar: { small: '', medium: '', large: '' },
            roles: [],
            hasAcceptedRules: false,
            cooldownLevel: 0,
            preferences: {},
            stats: { totalGames: 0, gamesByClass: {} },
          },
        },
        { upsert: true },
      )
    }),
  )
}
