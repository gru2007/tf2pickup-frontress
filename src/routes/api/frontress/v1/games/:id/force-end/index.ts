import { z } from 'zod'
import { collections } from '../../../../../../../database/collections'
import { GameKind } from '../../../../../../../database/models/game.model'
import { errors } from '../../../../../../../errors'
import { authorize } from '../../../../../../../frontress/authorize'
import { gameToDto } from '../../../../../../../frontress/game-to-dto'
import { externalMatchIdSchema } from '../../../../../../../frontress/schemas/external-match-id'
import { forceEnd } from '../../../../../../../games/force-end'
import { routes } from '../../../../../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.put(
    '/',
    { schema: { params: z.object({ id: externalMatchIdSchema }) } },
    async (request, reply) => {
      authorize(request)
      const game = await collections.games.findOne({
        kind: GameKind.frontress,
        'frontress.externalMatchId': request.params.id,
      })
      if (!game) throw errors.notFound('Frontress game not found')
      return reply.status(200).send(gameToDto(await forceEnd(game.number, 'bot')))
    },
  )
})
