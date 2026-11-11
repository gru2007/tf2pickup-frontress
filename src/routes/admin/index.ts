import { PlayerRole } from '../../auth/player-role'
import { routes } from '../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
    await reply.redirect('/admin/game-servers')
  })
})
