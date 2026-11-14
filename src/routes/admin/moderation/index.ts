import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { ModerationPage } from '../../../admin/moderation/views/html/moderation.page'
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
          steamId: steamId64.optional(),
          q: z.string().max(100).default(''),
        }),
      },
    },
    async (request, reply) => {
      await reply.html(ModerationPage(request.query))
    },
  )
  app.post(
    '/clans/:clanId',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        params: z.object({ clanId: z.string().regex(/^[a-z2-9]{8}$/) }),
        body: z.object({
          action: z.enum(['ban', 'delete', 'unban']),
          reason,
          restrict_members: z.enum(['on']).optional(),
          confirm: z.literal('yes'),
        }),
      },
    },
    async (request, reply) => {
      try {
        await gc.moderateClan(request.params.clanId, request.user!.player.steamId, {
          action: request.body.action,
          reason: request.body.reason,
          restrict_members: request.body.restrict_members === 'on',
        })
        request.flash(
          'success',
          request.body.action === 'unban'
            ? 'Clan name and tag released. The deleted clan and member restrictions are unchanged.'
            : 'Clan removed. The selected restrictions apply immediately.',
        )
      } catch (error) {
        if (!gc.isGcError(error)) throw error
        request.flash('error', error.message)
      }
      return reply.redirect('/admin/moderation')
    },
  )
  app.post(
    '/clans/:clanId/tag',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        params: z.object({ clanId: z.string().regex(/^[a-z2-9]{8}$/) }),
        body: z.object({ tag: z.string().trim().min(2).max(5), reason }),
      },
    },
    async (request, reply) => {
      try {
        await gc.moderateClan(request.params.clanId, request.user!.player.steamId, {
          action: 'set_tag',
          tag: request.body.tag,
          reason: request.body.reason,
        })
        request.flash('success', 'Clan tag updated. Members and progress are preserved.')
      } catch (error) {
        if (!gc.isGcError(error)) throw error
        request.flash('error', error.message)
      }
      return reply.redirect('/admin/moderation')
    },
  )
  app.post(
    '/players',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        body: z.object({
          steamId: steamId64,
          action: z.enum(['restrict_creation', 'allow_creation', 'mute', 'unmute', 'clear_chat']),
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
        request.flash('success', 'Player restriction saved and applied')
      } catch (error) {
        if (!gc.isGcError(error)) throw error
        request.flash('error', error.message)
      }
      return reply.redirect(`/admin/moderation?steamId=${request.body.steamId}`)
    },
  )
})
