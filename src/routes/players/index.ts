import { z } from 'zod'
import { PlayerListPage } from '../../players/views/html/player-list.page'
import { routes } from '../../utils/routes'
import { firstNonEmpty } from '../../utils/first-non-empty'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    { schema: { querystring: z.object({ q: z.string().max(64).optional() }) } },
    async (request, reply) => {
      await reply.html(PlayerListPage({ q: firstNonEmpty(request.query.q?.trim()) }))
    },
  )
})
