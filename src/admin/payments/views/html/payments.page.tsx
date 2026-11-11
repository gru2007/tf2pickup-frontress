import { format } from 'date-fns'
import { gc } from '../../../../gc'
import type { GcPayments } from '../../../../gc/schemas'
import { Admin } from '../../../views/html/admin'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { PlayerLink } from '../../../../html/components/player-link'

export function transactionTotal(t: NonNullable<GcPayments['transactions']>[number]) {
  return (t.items ?? []).reduce((sum, item) => sum + item.amount + item.vat, 0)
}

function money(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

// Donations and subscriptions players made in the game's support tab. Steam
// takes the money; the coordinator keeps the record and reconciles it with
// Steam. Refunds and cancellations go through the coordinator, once each.
export async function PaymentsPage() {
  const data = await gc.payments()
  return (
    <Admin activePage="payments">
      {!data ? (
        <div class="admin-panel-set">
          Steam payments are disabled (or fake) on the coordinator. Turn on support in gc.json.
        </div>
      ) : (
        <>
          <div class="admin-panel-set">
            <div
              class={['banner mb-4', data.sandbox ? '' : '']}
              data-tone={data.sandbox ? 'info' : 'warning'}
            >
              <span safe>
                {`${data.sandbox ? 'Sandbox: no money moves' : 'Live payments'} · AppID ${data.app_id} · last reconciled ${data.last_sync ? format(data.last_sync, 'dd.MM.yyyy HH:mm') : 'never'}`}
              </span>
            </div>
            {data.sync_error && (
              <div class="banner mb-4" data-tone="alert">
                <span safe>{`Reconciliation failed: ${data.sync_error}`}</span>
              </div>
            )}

            <h4 class="pb-4">Steam transactions</h4>
            <div class="max-lg:overflow-x-auto">
              <AdminTable head={['Transaction', 'Player', 'Amount', 'Status', '']}>
                {(data.transactions ?? []).map(t => (
                  <tr>
                    <AdminCell>
                      <span safe>{t.transid}</span>
                      <div class="text-abru-light-50 text-xs" safe>{`order ${t.orderid}`}</div>
                    </AdminCell>
                    <AdminCell>
                      <PlayerLink steamId={t.steamid} class="underline" />
                    </AdminCell>
                    <AdminCell>
                      <span safe>{money(transactionTotal(t), t.currency)}</span>
                    </AdminCell>
                    <AdminCell>
                      <span safe>{t.status}</span>
                      {t.agreementid && (
                        <div class="text-abru-light-50 text-xs" safe>
                          {`subscription ${t.agreementid}: ${t.agreementstatus ?? '?'}, next ${t.nextpayment ?? '—'}`}
                        </div>
                      )}
                    </AdminCell>
                    <AdminCell>
                      <div class="flex flex-col gap-2">
                        {t.status === 'Succeeded' && t.orderid !== '0' && (
                          <button
                            class="button"
                            data-size="dense"
                            hx-post="/admin/payments/refund"
                            hx-vals={JSON.stringify({ order: t.orderid })}
                            hx-prompt={`Refund ${money(transactionTotal(t), t.currency)}? Reason:`}
                            hx-target="body"
                          >
                            Refund
                          </button>
                        )}
                        {t.agreementid && t.agreementstatus?.toLowerCase() !== 'canceled' && (
                          <button
                            class="button"
                            data-size="dense"
                            hx-post="/admin/payments/cancel-subscription"
                            hx-vals={JSON.stringify({
                              steamId: t.steamid,
                              agreement: t.agreementid,
                            })}
                            hx-prompt="Cancel this subscription's renewal? Reason:"
                            hx-target="body"
                          >
                            Cancel renewal
                          </button>
                        )}
                      </div>
                    </AdminCell>
                  </tr>
                ))}
              </AdminTable>
            </div>
          </div>

          <div class="admin-panel-set mt-4">
            <h4 class="pb-4">Orders from the game</h4>
            <div class="max-lg:overflow-x-auto">
              <AdminTable head={['Order', 'Player', 'Kind', 'Amount', 'Opened', 'State']}>
                {(data.orders ?? []).map(o => (
                  <tr>
                    <AdminCell>
                      <span safe>{o.order}</span>
                    </AdminCell>
                    <AdminCell>
                      <PlayerLink steamId={o.steam_id} name={o.name} class="underline" />
                    </AdminCell>
                    <AdminCell>{o.kind === 'monthly' ? 'monthly' : 'one-off'}</AdminCell>
                    <AdminCell>
                      <span safe>{money(o.amount, o.currency)}</span>
                    </AdminCell>
                    <AdminCell>
                      <span safe>{format(o.opened, 'dd.MM.yyyy HH:mm')}</span>
                    </AdminCell>
                    <AdminCell>
                      <span safe>
                        {o.refunded
                          ? 'refunded'
                          : o.paid
                            ? 'paid'
                            : o.failed
                              ? `failed: ${o.failed}`
                              : 'pending'}
                      </span>
                    </AdminCell>
                  </tr>
                ))}
              </AdminTable>
            </div>
          </div>

          <div class="admin-panel-set mt-4">
            <h4 class="pb-4">Operations</h4>
            <AdminTable head={['When', 'Operation', 'By', 'Reason', 'Result']}>
              {(data.operations ?? []).map(op => (
                <tr>
                  <AdminCell>
                    <span safe>{format(op.at, 'dd.MM.yyyy HH:mm')}</span>
                  </AdminCell>
                  <AdminCell>
                    <span safe>{`${op.action} ${op.order ?? op.agreement ?? ''}`}</span>
                  </AdminCell>
                  <AdminCell>
                    <PlayerLink steamId={op.actor} class="underline" />
                  </AdminCell>
                  <AdminCell>
                    <span safe>{op.reason}</span>
                  </AdminCell>
                  <AdminCell>
                    <span safe>{`${op.state}${op.message ? `: ${op.message}` : ''}`}</span>
                  </AdminCell>
                </tr>
              ))}
            </AdminTable>
            <p class="text-abru-light-50 mt-4 text-xs">
              unknown: Steam has not confirmed the result yet. Nothing is retried automatically; the
              coordinator asks Steam until it knows.
            </p>
          </div>
        </>
      )}
    </Admin>
  )
}
