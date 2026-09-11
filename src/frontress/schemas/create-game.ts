import { z } from 'zod'
import { steamId64 } from '../../shared/schemas/steam-id-64'
import { Tf2Team } from '../../shared/types/tf2-team'
import { externalMatchIdSchema } from './external-match-id'

const player = z.object({
  steamId: steamId64,
  name: z.string().trim().max(128).default(''),
  team: z.enum(Tf2Team),
})

export const createGameSchema = z
  .object({
    externalMatchId: externalMatchIdSchema,
    map: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
    matchGroup: z.number().int().min(0),
    // Optional only for rolling compatibility with an older gateway. New
    // gateways always send this explicitly; create-game derives the legacy
    // value from matchEmulation when it is absent.
    matchMode: z.enum(['frontline', 'ranked']).optional(),
    maxPlayers: z.number().int().min(2).max(100),
    serverConfig: z
      .string()
      .trim()
      .max(128)
      .regex(/^[A-Za-z0-9_-]*$/)
      .default(''),
    matchEmulation: z.number().int().min(0).max(2),
    players: z.array(player).min(2).max(100),
  })
  .superRefine((game, context) => {
    if (game.maxPlayers % 2 !== 0) {
      context.addIssue({ code: 'custom', path: ['maxPlayers'], message: 'must be even' })
    }
    if (game.players.length > game.maxPlayers) {
      context.addIssue({ code: 'custom', path: ['players'], message: 'exceeds maxPlayers' })
    }

    const seen = new Set<string>()
    const teamCap = game.maxPlayers / 2
    for (const team of Object.values(Tf2Team)) {
      if (game.players.filter(player => player.team === team).length > teamCap) {
        context.addIssue({
          code: 'custom',
          path: ['players'],
          message: `${team} exceeds team capacity`,
        })
      }
    }
    for (const [index, value] of game.players.entries()) {
      if (seen.has(value.steamId)) {
        context.addIssue({
          code: 'custom',
          path: ['players', index, 'steamId'],
          message: 'duplicate player',
        })
      }
      seen.add(value.steamId)
    }
  })
