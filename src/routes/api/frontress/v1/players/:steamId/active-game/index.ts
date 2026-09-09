import { z } from 'zod'
import { collections } from '../../../../../../../database/collections'
import { GameKind, GameState } from '../../../../../../../database/models/game.model'
import { authorize } from '../../../../../../../frontress/authorize'
import { gameToDto } from '../../../../../../../frontress/game-to-dto'
import { steamId64 } from '../../../../../../../shared/schemas/steam-id-64'
import { routes } from '../../../../../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get('/', { schema: { params: z.object({ steamId: steamId64 }) } }, async (request, reply) => {
    authorize(request)
    const player = await collections.players.findOne(
      { steamId: request.params.steamId },
      { projection: { activeGame: 1 } },
    )
    if (!player?.activeGame) return reply.status(200).send({ game: null })

    const game = await collections.games.findOne({
      number: player.activeGame,
      kind: GameKind.frontress,
      state: { $nin: [GameState.ended, GameState.interrupted] },
    })
    return reply.status(200).send({ game: game ? gameToDto(game) : null })
  })
})
