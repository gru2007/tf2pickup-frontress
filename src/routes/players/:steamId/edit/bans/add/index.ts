import { z } from 'zod'
import { PlayerRole } from '../../../../../../auth/player-role'
import { AddBanPage } from '../../../../../../players/views/html/add-ban.page'
import { steamId64 } from '../../../../../../shared/schemas/steam-id-64'
import { routes } from '../../../../../../utils/routes'
import { gc } from '../../../../../../gc'
import { banHours } from '../../../../../../players/ban-hours'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get(
      '/',
      {
        config: { authorize: [PlayerRole.admin] },
        schema: {
          params: z.object({ steamId: steamId64 }),
          querystring: z.object({ reports: z.string().optional() }),
        },
      },
      async (request, reply) => {
        await reply.status(200).html(
          AddBanPage({
            steamId: request.params.steamId,
            fromReports: Boolean(request.query.reports),
          }),
        )
      },
    )
    .post(
      '/',
      {
        config: { authorize: [PlayerRole.admin] },
        schema: {
          params: z.object({ steamId: steamId64 }),
          body: z.object({
            lengthSelector: z.enum(['duration', 'forever']),
            duration: z.coerce.number().int().min(1).optional(),
            durationUnits: z.enum(['hours', 'days', 'weeks', 'months']).optional(),
            reason: z.string().trim().min(1).max(300),
            // When the checkbox is unchecked, browsers omit it from the request body entirely.
            steam: z.coerce.boolean().default(false),
            reports: z.string().optional(),
          }),
        },
      },
      async (request, reply) => {
        const { steamId } = request.params
        const ban = {
          action: 'ban' as const,
          hours: banHours(request.body),
          reason: request.body.reason,
          steam: request.body.steam,
        }
        const actor = request.user!.player.steamId
        if (request.body.reports) {
          await gc.reportAction(steamId, actor, ban)
        } else {
          await gc.antiCheatAction(steamId, actor, ban)
        }
        request.flash('success', `Player banned`)
        await reply.redirect(`/players/${steamId}/edit/bans`)
      },
    )
})
