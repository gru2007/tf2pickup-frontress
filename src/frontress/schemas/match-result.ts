import { z } from 'zod'
import { steamId64 } from '../../shared/schemas/steam-id-64'
import { Tf2Team } from '../../shared/types/tf2-team'

export const matchResultSchema = z.object({
  redScore: z.number().int().nonnegative(),
  bluScore: z.number().int().nonnegative(),
  aborted: z.boolean(),
  players: z
    .array(
      z.object({
        steamId: steamId64,
        team: z.enum(Tf2Team),
      }),
    )
    .default([]),
})

export type MatchResult = z.infer<typeof matchResultSchema>
