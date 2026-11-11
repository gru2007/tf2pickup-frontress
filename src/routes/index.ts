import disableCache from 'fastify-disablecache'
import { GameListPage } from '../games/views/html/game-list.page'
import { routes } from '../utils/routes'

export default routes(async app => {
  await app.register(disableCache)
  app.get('/', async (_req, reply) => {
    return reply.html(GameListPage({ page: 1, home: true }))
  })
})
