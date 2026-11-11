import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { PlayerRestrictionsPage } from '../../../admin/player-restrictions/views/html/player-restrictions.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { saveSettings } from '../../../admin/save-settings'
import { formValues } from '../../../admin/form-values'
import { errors } from '../../../errors'

const form = z.record(z.string(), z.unknown())
const steamIds = (value: unknown) => formValues.lines(value).filter(id => /^[0-9]{17}$/.test(id))

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
      await reply.status(200).html(PlayerRestrictionsPage())
    })
    .post(
      '/chat',
      { config: { authorize: [PlayerRole.superUser] }, schema: { body: form } },
      async (request, reply) => {
        const { settings } = await gc.settings()
        const b = request.body
        const chat = {
          ...settings.sections.chat,
          disabled: formValues.checked(b['disabled']),
          history: formValues.number(b['history']),
          muted_steam_ids: steamIds(b['muted_steam_ids']),
          banned_words: formValues.lines(b['banned_words']),
        }
        return saveSettings(request, reply, {
          revision: formValues.number(b['revision']),
          sections: { chat },
          note: 'chat',
          back: '/admin/player-restrictions',
        })
      },
    )
    .post(
      '/:id',
      {
        config: { authorize: [PlayerRole.superUser] },
        schema: { params: z.object({ id: z.coerce.number().int() }), body: form },
      },
      async (request, reply) => {
        const { settings } = await gc.settings()
        const groups = settings.sections.match_groups ?? []
        const group = groups.find(g => g.match_group === request.params.id)
        if (!group) {
          throw errors.notFound('No such queue')
        }
        const b = request.body
        group.restrictions = {
          ...group.restrictions,
          require_verified_auth: formValues.checked(b['require_verified_auth']),
          max_party_size: formValues.number(b['max_party_size']),
          min_party_size: formValues.number(b['min_party_size']),
          min_matches_played: formValues.number(b['min_matches_played']),
          abandon_cooldown_mins: formValues.number(b['abandon_cooldown_mins']),
          max_abandons: formValues.number(b['max_abandons']),
          allowed_steam_ids: steamIds(b['allowed_steam_ids']),
          banned_steam_ids: steamIds(b['banned_steam_ids']),
        }
        return saveSettings(request, reply, {
          revision: formValues.number(b['revision']),
          sections: { match_groups: groups },
          note: `restrictions of queue ${group.match_group}`,
          back: '/admin/player-restrictions',
        })
      },
    )
})
