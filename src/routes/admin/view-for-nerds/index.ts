import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import {
  ViewForNerdsPage,
  rawSections,
} from '../../../admin/view-for-nerds/views/html/view-for-nerds.page'
import { routes } from '../../../utils/routes'
import { saveSettings } from '../../../admin/save-settings'
import { formValues } from '../../../admin/form-values'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
      await reply.status(200).html(ViewForNerdsPage())
    })
    .post(
      '/:section',
      {
        config: { authorize: [PlayerRole.superUser] },
        schema: {
          params: z.object({ section: z.enum(rawSections) }),
          body: z.record(z.string(), z.unknown()),
        },
      },
      async (request, reply) => {
        let value: unknown
        try {
          value = JSON.parse(formValues.raw(request.body['value']))
        } catch (error) {
          request.flash('error', `Not JSON: ${(error as Error).message}`)
          return reply.redirect('/admin/view-for-nerds')
        }
        return saveSettings(request, reply, {
          revision: formValues.number(request.body['revision']),
          sections: { [request.params.section]: value },
          note: `${request.params.section} (raw)`,
          back: '/admin/view-for-nerds',
        })
      },
    )
})
