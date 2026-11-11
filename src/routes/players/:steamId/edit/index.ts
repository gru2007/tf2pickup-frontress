import { z } from 'zod'
import { PlayerRole } from '../../../../auth/player-role'
import { steamId64 } from '../../../../shared/schemas/steam-id-64'
import { routes } from '../../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: { params: z.object({ steamId: steamId64 }) },
    },
    async (request, reply) => {
      await reply.redirect(`/players/${request.params.steamId}/edit/bans`)
    },
  )
})
