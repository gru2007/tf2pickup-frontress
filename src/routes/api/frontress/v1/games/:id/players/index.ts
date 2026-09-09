import { z } from 'zod'
import { addPlayers } from '../../../../../../../frontress/add-players'
import { authorize } from '../../../../../../../frontress/authorize'
import { gameToDto } from '../../../../../../../frontress/game-to-dto'
import { addPlayersSchema } from '../../../../../../../frontress/schemas/add-players'
import { externalMatchIdSchema } from '../../../../../../../frontress/schemas/external-match-id'
import { routes } from '../../../../../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.post(
    '/',
    {
      schema: {
        params: z.object({ id: externalMatchIdSchema }),
        body: addPlayersSchema,
      },
    },
    async (request, reply) => {
      authorize(request)
      const game = await addPlayers(request.params.id, request.body.players)
      return reply.status(200).send(gameToDto(game))
    },
  )
})
