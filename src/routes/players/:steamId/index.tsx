import z from 'zod'
import { PlayerGameList, PlayerPage } from '../../../players/views/html/player.page'
import { steamId64 } from '../../../shared/schemas/steam-id-64'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    {
      schema: {
        params: z.object({ steamId: steamId64 }),
        querystring: z.object({ gamespage: z.coerce.number().optional() }),
      },
    },
    async (req, reply) => {
      const { steamId } = req.params
      const page = Number(req.query.gamespage) || 1
      if (req.isPartialFor('gameList')) {
        await reply.html(<PlayerGameList steamId={steamId} page={page} />)
        return
      }
      const player = await gc.player(steamId)
      await reply.html(<PlayerPage player={player} page={page} />)
    },
  )
})
