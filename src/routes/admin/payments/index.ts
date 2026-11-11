import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { PaymentsPage, transactionTotal } from '../../../admin/payments/views/html/payments.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { errors } from '../../../errors'
import { promptReason } from '../../../utils/prompt-reason'
import { steamId64 } from '../../../shared/schemas/steam-id-64'

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.superUser] } }, async (_request, reply) => {
      await reply.status(200).html(PaymentsPage())
    })
    .post(
      '/refund',
      {
        config: { authorize: [PlayerRole.superUser] },
        schema: { body: z.object({ order: z.string().regex(/^[0-9]{1,20}$/) }) },
      },
      async (request, reply) => {
        const reason = promptReason(request, 3)
        const data = await gc.payments()
        const transaction = data?.transactions?.find(t => t.orderid === request.body.order)
        if (!data || !transaction) {
          throw errors.notFound('No such transaction')
        }
        // The amount is what Steam last reported; the coordinator checks it again.
        const result = await gc.paymentOperation(request.user!.player.steamId, {
          id: randomUUID(),
          action: 'refund',
          order: transaction.orderid,
          steam_id: transaction.steamid,
          amount: transactionTotal(transaction),
          currency: transaction.currency,
          app_id: data.app_id,
          sandbox: data.sandbox,
          reason,
        })
        request.flash('success', `Refund ${result.state}`)
        await reply.header('HX-Refresh', 'true').status(200).send()
      },
    )
    .post(
      '/cancel-subscription',
      {
        config: { authorize: [PlayerRole.superUser] },
        schema: {
          body: z.object({ steamId: steamId64, agreement: z.string().regex(/^[0-9]{1,20}$/) }),
        },
      },
      async (request, reply) => {
        const reason = promptReason(request, 3)
        const data = await gc.payments()
        if (!data) {
          throw errors.serviceUnavailable('Payments are disabled on the coordinator')
        }
        const result = await gc.paymentOperation(request.user!.player.steamId, {
          id: randomUUID(),
          action: 'cancel_subscription',
          steam_id: request.body.steamId,
          agreement: request.body.agreement,
          app_id: data.app_id,
          sandbox: data.sandbox,
          reason,
        })
        request.flash('success', `Cancellation ${result.state}`)
        await reply.header('HX-Refresh', 'true').status(200).send()
      },
    )
})
