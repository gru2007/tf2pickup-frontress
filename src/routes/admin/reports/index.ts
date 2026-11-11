import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { ReportsPage } from '../../../admin/reports/views/html/reports.page'
import { routes } from '../../../utils/routes'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        querystring: z.object({ status: z.enum(['open', 'closed', 'all']).default('open') }),
      },
    },
    async (request, reply) => {
      await reply.status(200).html(ReportsPage({ status: request.query.status }))
    },
  )
})
