import { routes } from '../../../../../utils/routes'
import { authorize } from '../../../../../frontress/authorize'
import { createGameSchema } from '../../../../../frontress/schemas/create-game'
import { createGame } from '../../../../../frontress/create-game'
import { gameToDto } from '../../../../../frontress/game-to-dto'
import { launchGame } from '../../../../../frontress/launch-game'
import { collections } from '../../../../../database/collections'
import { GameKind, GameState } from '../../../../../database/models/game.model'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get('/', async request => {
    authorize(request)
    const games = await collections.games
      .find({
        kind: GameKind.frontress,
        state: {
          $in: [GameState.created, GameState.configuring, GameState.launching, GameState.started],
        },
      })
      .sort({ number: 1 })
      .toArray()
    return { games: games.map(gameToDto) }
  })

  app.post('/', { schema: { body: createGameSchema } }, async (request, reply) => {
    authorize(request)
    const { game, created } = await createGame(request.body)
    launchGame(game.number)
    return reply.status(created ? 202 : 200).send(gameToDto(game))
  })
})
