import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { MapPoolPage } from '../../../admin/map-pool/views/html/map-pool.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { saveSettings } from '../../../admin/save-settings'
import { formValues } from '../../../admin/form-values'
import { errors } from '../../../errors'

const form = z.record(z.string(), z.unknown())
const mapName = /^[a-z0-9_]{3,64}$/

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
      await reply.status(200).html(MapPoolPage())
    })
    .post(
      '/index',
      { config: { authorize: [PlayerRole.superUser] }, schema: { body: form } },
      async (request, reply) => {
        const index: Record<string, number> = {}
        for (const line of formValues.raw(request.body['map_index']).split('\n')) {
          if (!line.trim()) continue
          const [map, def] = line.split('=').map(v => v.trim())
          const n = Number(def)
          if (!map || !mapName.test(map) || !Number.isInteger(n) || n < 0) {
            request.flash('error', `Not "map = index": ${line.trim()}`)
            return reply.redirect('/admin/map-pool')
          }
          index[map] = n
        }
        return saveSettings(request, reply, {
          revision: formValues.number(request.body['revision']),
          sections: { map_index: index },
          note: 'map index',
          back: '/admin/map-pool',
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
        const maps = formValues.lines(request.body['maps']).map(m => m.toLowerCase())
        const bad = maps.find(m => !mapName.test(m))
        if (bad) {
          request.flash('error', `Not a map name: ${bad}`)
          return reply.redirect('/admin/map-pool')
        }
        group.modes = formValues.list(request.body['modes'])
        group.maps = [...new Set(maps)]
        return saveSettings(request, reply, {
          revision: formValues.number(request.body['revision']),
          sections: { match_groups: groups },
          note: `maps of queue ${group.match_group}`,
          back: '/admin/map-pool',
        })
      },
    )
})
