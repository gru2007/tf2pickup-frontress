import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { GamesPage } from '../../../admin/games/views/html/games.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { saveSettings } from '../../../admin/save-settings'
import { formValues } from '../../../admin/form-values'
import { errors } from '../../../errors'

const form = z.record(z.string(), z.unknown())
const groupParams = z.object({ id: z.coerce.number().int().min(0).max(100) })

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
      await reply.status(200).html(GamesPage())
    })
    .post(
      '/groups/:id',
      {
        config: { authorize: [PlayerRole.superUser] },
        schema: { params: groupParams, body: form },
      },
      async (request, reply) => {
        const { settings } = await gc.settings()
        const groups = settings.sections.match_groups ?? []
        const group = groups.find(g => g.match_group === request.params.id)
        if (!group) {
          throw errors.notFound('No such queue')
        }
        const b = request.body
        group.enabled = formValues.checked(b['enabled'])
        group.name = formValues.text(b['name'])
        group.mode = formValues.text(b['mode']) === 'ranked' ? 'ranked' : 'frontline'
        group.min_players = formValues.number(b['min_players'])
        group.ideal_players = formValues.number(b['ideal_players'])
        group.max_players = formValues.number(b['max_players'])
        group.patient_secs = formValues.number(b['patient_secs'])
        group.backfill_secs = formValues.number(b['backfill_secs'])
        const region = formValues.text(b['region'])
        if (region) {
          group.region = region
        } else {
          delete group.region
        }
        return saveSettings(request, reply, {
          revision: formValues.number(b['revision']),
          sections: { match_groups: groups },
          note: `queue ${group.match_group}`,
          back: '/admin/games',
        })
      },
    )
    .post(
      '/groups',
      { config: { authorize: [PlayerRole.superUser] }, schema: { body: form } },
      async (request, reply) => {
        const { settings } = await gc.settings()
        const groups = settings.sections.match_groups ?? []
        const id = formValues.number(request.body['match_group'], -1)
        if (id < 0 || groups.some(g => g.match_group === id)) {
          request.flash('error', 'That match group already has a queue')
          return reply.redirect('/admin/games')
        }
        groups.push({
          match_group: id,
          name: formValues.text(request.body['name']) || `Queue ${id}`,
          enabled: false,
          mode: 'frontline',
          min_players: 2,
          ideal_players: 12,
          max_players: 24,
          patient_secs: 60,
          backfill_secs: 0,
          maps: [],
          restrictions: {
            require_verified_auth: false,
            max_party_size: 0,
            min_party_size: 0,
            min_matches_played: 0,
            abandon_cooldown_mins: 0,
            max_abandons: 0,
          },
        })
        return saveSettings(request, reply, {
          revision: formValues.number(request.body['revision']),
          sections: { match_groups: groups },
          note: `add queue ${id}`,
          back: '/admin/games',
        })
      },
    )
    .post(
      '/groups/delete',
      { config: { authorize: [PlayerRole.superUser] }, schema: { body: form } },
      async (request, reply) => {
        const id = formValues.number(request.body['id'], -1)
        const { settings } = await gc.settings()
        const groups = (settings.sections.match_groups ?? []).filter(g => g.match_group !== id)
        return saveSettings(request, reply, {
          revision: formValues.number(request.body['revision']),
          sections: { match_groups: groups },
          note: `remove queue ${id}`,
          back: '/admin/games',
        })
      },
    )
})
