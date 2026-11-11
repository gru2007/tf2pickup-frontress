import { z } from 'zod'
import { PlayerRole } from '../../../../../auth/player-role'
import { steamId64 } from '../../../../../shared/schemas/steam-id-64'
import { EditPlayerReportsPage } from '../../../../../players/views/html/edit-player.page'
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
        await reply.status(200).html(EditPlayerReportsPage({ steamId: req.params.steamId }))
      },
    )
    .post(
      '/dismiss',
      {
        config: { authorize: [PlayerRole.admin] },
        schema: { params: z.object({ steamId: steamId64 }) },
      },
      async (request, reply) => {
        const reason = promptReason(request)
        await gc.reportAction(request.params.steamId, request.user!.player.steamId, {
          action: 'dismiss',
          reason,
        })
        request.flash('success', 'Reports dismissed')
        await reply.header('HX-Refresh', 'true').status(200).send()
      },
    )
})
