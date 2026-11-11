import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { LogsPage } from '../../../admin/logs/views/html/logs.page'
import { routes } from '../../../utils/routes'

const id = z.string().trim().max(32).optional()

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app.get(
    '/',
    {
      config: { authorize: [PlayerRole.admin] },
      schema: {
        querystring: z.object({
          player: id,
          server: id,
          match: id,
          q: z.string().trim().max(100).optional(),
          level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
          before: z.coerce.number().int().positive().optional(),
        }),
      },
    },
    async (request, reply) => {
      await reply.status(200).html(LogsPage({ filter: request.query }))
    },
  )
})
