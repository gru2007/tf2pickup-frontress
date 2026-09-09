import { z } from 'zod'
import { collections } from '../../../../../../database/collections'
import { errors } from '../../../../../../errors'
import { authorize } from '../../../../../../frontress/authorize'
import { gameToDto } from '../../../../../../frontress/game-to-dto'
import { externalMatchIdSchema } from '../../../../../../frontress/schemas/external-match-id'
import { routes } from '../../../../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    { schema: { params: z.object({ id: externalMatchIdSchema }) } },
    async (request, reply) => {
      authorize(request)
      const game = await collections.games.findOne({
        'frontress.externalMatchId': request.params.id,
      })
      if (!game) throw errors.notFound('Frontress game not found')
      return reply.status(200).send(gameToDto(game))
    },
  )
})
