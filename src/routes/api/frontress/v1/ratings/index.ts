import { collections } from '../../../../../database/collections'
import { defaultElo } from '../../../../../games/calculate-elo-updates'
import { authorize } from '../../../../../frontress/authorize'
import { ratingsSchema } from '../../../../../frontress/schemas/ratings'
import { frontressGameClass } from '../../../../../shared/types/game-class-name'
import { routes } from '../../../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.post('/', { schema: { body: ratingsSchema } }, async (request, reply) => {
    authorize(request)
    const players = await collections.players
      .find(
        { steamId: { $in: request.body.steamIds } },
        { projection: { steamId: 1, [`elo.${frontressGameClass}`]: 1 } },
      )
      .toArray()
    const ratings = new Map(
      players.map(player => [player.steamId, player.elo?.[frontressGameClass] ?? defaultElo]),
    )
    return reply.status(200).send({
      ratings: request.body.steamIds.map(steamId => ({
        steamId,
        rating: ratings.get(steamId) ?? defaultElo,
      })),
    })
  })
})
