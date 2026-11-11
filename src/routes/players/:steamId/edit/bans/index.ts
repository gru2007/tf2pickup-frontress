import { z } from 'zod'
import { PlayerRole } from '../../../../../auth/player-role'
import { steamId64 } from '../../../../../shared/schemas/steam-id-64'
import { EditPlayerBansPage } from '../../../../../players/views/html/edit-player.page'
import { routes } from '../../../../../utils/routes'
import { gc } from '../../../../../gc'
import { promptReason } from '../../../../../utils/prompt-reason'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get(
      '/',
      {
        config: { authorize: [PlayerRole.admin] },
        schema: { params: z.object({ steamId: steamId64 }) },
      },
      async (req, reply) => {
        await reply.status(200).html(EditPlayerBansPage({ steamId: req.params.steamId }))
      },
    )
    .put(
      '/:action',
      {
        config: { authorize: [PlayerRole.admin] },
        schema: {
          params: z.object({ steamId: steamId64, action: z.enum(['clear', 'steam_unban']) }),
        },
      },
      async (request, reply) => {
        const reason = promptReason(request)
        await gc.antiCheatAction(request.params.steamId, request.user!.player.steamId, {
          action: request.params.action,
          reason,
        })
        request.flash('success', 'Ban lifted')
        await reply.header('HX-Refresh', 'true').status(200).send()
      },
    )
})
