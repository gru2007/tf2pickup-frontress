import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { ChatPage } from '../../../admin/chat/views/html/chat.page'
import { steamId64 } from '../../../shared/schemas/steam-id-64'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'

const reason = z.string().trim().min(1).max(300)
// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        querystring: z.object({
          source: z.enum(['all', 'menu', 'match']).default('all'),
          steamId: z.union([steamId64, z.literal('')]).default(''),
          q: z.string().max(200).default(''),
          before: z.coerce.number().int().positive().optional(),
        }),
      },
    },
    async (request, reply) => {
      await reply.html(ChatPage(request.query))
    },
  )
  app.post(
    '/messages/:message',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        params: z.object({
          message: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        }),
        body: z.object({ reason, epoch: z.string().min(1).max(30) }),
      },
    },
    async (request, reply) => {
      try {
        await gc.deleteChatMessage(
          request.params.message,
          request.user!.player.steamId,
          request.body.reason,
          request.body.epoch,
        )
        request.flash('success', 'Message removed from retained chat')
      } catch (error) {
        if (!gc.isGcError(error)) throw error
        request.flash('error', error.message)
      }
      return reply.redirect('/admin/chat')
    },
  )
  app.post(
    '/players',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        body: z.object({
          steamId: steamId64,
          action: z.enum(['mute', 'unmute', 'clear_chat']),
          reason,
        }),
      },
    },
    async (request, reply) => {
      try {
        await gc.moderatePlayer(request.body.steamId, request.user!.player.steamId, {
          action: request.body.action,
          reason: request.body.reason,
        })
        request.flash(
          'success',
          'Chat moderation applied. Check server policy acknowledgements below.',
        )
      } catch (error) {
        if (!gc.isGcError(error)) throw error
        request.flash('error', error.message)
      }
      return reply.redirect(`/admin/chat?steamId=${request.body.steamId}`)
    },
  )
})
