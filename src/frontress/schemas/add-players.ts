import { z } from 'zod'
import { steamId64 } from '../../shared/schemas/steam-id-64'
import { Tf2Team } from '../../shared/types/tf2-team'

export const addPlayersSchema = z.object({
  players: z
    .array(
      z.object({
        steamId: steamId64,
        name: z.string().trim().max(128).default(''),
        team: z.enum(Tf2Team),
      }),
    )
    .min(1)
    .max(100),
})
