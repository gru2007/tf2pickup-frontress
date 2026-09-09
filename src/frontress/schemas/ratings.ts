import { z } from 'zod'
import { steamId64 } from '../../shared/schemas/steam-id-64'

export const ratingsSchema = z.object({
  steamIds: z.array(steamId64).min(1).max(100),
})
