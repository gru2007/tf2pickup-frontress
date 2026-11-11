import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { GameServersPage } from '../../../admin/game-servers/views/html/game-servers.page'
import { NewServerKeyPage } from '../../../admin/game-servers/views/html/new-server-key.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { formValues } from '../../../admin/form-values'

const form = z.record(z.string(), z.unknown())

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
      await reply.status(200).html(GameServersPage())
    })
    .post(
      '/keys',
      { config: { authorize: [PlayerRole.superUser] }, schema: { body: form } },
      async (request, reply) => {
        const name = formValues.text(request.body['name'])
        try {
          const result = await gc.changeServerKey(request.user!.player.steamId, {
            action: 'create',
            name,
            community: formValues.text(request.body['community']),
            region: formValues.text(request.body['region']).toLowerCase(),
            anticheat_authority: formValues.checked(request.body['anticheat_authority']),
          })
          await reply.html(NewServerKeyPage({ name, serverKey: result.key ?? '' }))
          return
        } catch (error) {
          if (!gc.isGcError(error)) throw error
          request.flash('error', error.message)
          return reply.redirect('/admin/game-servers')
        }
      },
    )
    .post(
      '/keys/:name/:action',
      {
        config: { authorize: [PlayerRole.superUser] },
        schema: {
          params: z.object({ name: z.string().max(64), action: z.enum(['rotate', 'revoke']) }),
        },
      },
      async (request, reply) => {
        const { name, action } = request.params
        try {
          const result = await gc.changeServerKey(request.user!.player.steamId, { action, name })
          if (action === 'rotate') {
            await reply.html(NewServerKeyPage({ name, serverKey: result.key ?? '' }))
            return
          }
          request.flash('success', `Key ${name} revoked`)
        } catch (error) {
          if (!gc.isGcError(error)) throw error
          request.flash('error', error.message)
        }
        return reply.redirect('/admin/game-servers')
      },
    )
})
