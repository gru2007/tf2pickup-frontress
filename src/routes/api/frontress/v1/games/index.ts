import { routes } from '../../../../../utils/routes'
import { authorize } from '../../../../../frontress/authorize'
import { createGameSchema } from '../../../../../frontress/schemas/create-game'
import { createGame } from '../../../../../frontress/create-game'
import { gameToDto } from '../../../../../frontress/game-to-dto'
import { launchGame } from '../../../../../frontress/launch-game'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.post('/', { schema: { body: createGameSchema } }, async (request, reply) => {
    authorize(request)
    const { game, created } = await createGame(request.body)
    launchGame(game.number)
    return reply.status(created ? 202 : 200).send(gameToDto(game))
  })
})
