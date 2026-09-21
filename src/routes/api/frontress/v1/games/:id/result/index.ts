import { authorize } from '../../../../../../../frontress/authorize'
import { finishGame } from '../../../../../../../frontress/finish-game'
import { gameToDto } from '../../../../../../../frontress/game-to-dto'
import { externalMatchIdSchema } from '../../../../../../../frontress/schemas/external-match-id'
import { matchResultSchema } from '../../../../../../../frontress/schemas/match-result'
import { routes } from '../../../../../../../utils/routes'
import { z } from 'zod'

export default routes(async app => {
  app.post(
    '/',
    {
      schema: {
        params: z.object({ id: externalMatchIdSchema }),
        body: matchResultSchema,
      },
    },
    async (request, reply) => {
      authorize(request)
      const game = await finishGame(request.params.id, request.body)
      return reply.status(200).send(gameToDto(game))
    },
  )
})
