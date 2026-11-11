import { z } from 'zod'
import { GamePage } from '../../../games/views/html/game.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { errors } from '../../../errors'
import { promptReason } from '../../../utils/prompt-reason'
import { PlayerRole } from '../../../auth/player-role'

const params = z.object({ number: z.string().regex(/^[0-9]{1,20}$/) })

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { schema: { params } }, async (request, reply) => {
      const game = await gc.match(request.params.number)
      if (!game) {
        throw errors.notFound(`game ${request.params.number} does not exist`)
      }
      await reply.html(GamePage({ game }))
    })
    .put(
      '/force-end',
      { config: { authorize: [PlayerRole.admin] }, schema: { params } },
      async (request, reply) => {
        const reason = promptReason(request)
        await gc.endMatch(request.params.number, request.user!.player.steamId, reason)
        request.flash('success', 'Game ended')
        await reply.header('HX-Refresh', 'true').status(200).send()
      },
    )
})
