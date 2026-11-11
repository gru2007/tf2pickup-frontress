import { format } from 'date-fns'
import type { GcReportCase } from '../../../../gc/schemas'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { firstNonEmpty } from '../../../../utils/first-non-empty'

const severityClass: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-300',
  low: 'text-abru-light-60',
}

// The report queue: one row per reported player, highest priority first.
export function ReportCaseList(props: { cases: GcReportCase[] }) {
  return (
    <>
      <AdminTable
        head={['Player', 'Priority', 'Reports', 'Reasons', 'EAC', 'Last report', 'Status']}
      >
        {props.cases.map(c => (
          <tr>
            <AdminCell bold>
              <a href={`/players/${c.steam_id}/edit/reports`} class="underline" safe>
                {firstNonEmpty(c.name, c.steam_id)}
              </a>
            </AdminCell>
            <AdminCell>
              <span class={severityClass[c.severity]} safe>
                {`${c.severity} · ${c.score.toFixed(1)}`}
              </span>
            </AdminCell>
            <AdminCell>
              <span
                safe
              >{`${c.open_reports} open / ${c.total_reports} · ${c.reporters} reporters`}</span>
            </AdminCell>
            <AdminCell>
              <span safe>
                {Object.entries(c.reasons ?? {})
                  .map(([reason, n]) => `${reason} ${n}`)
                  .join(', ')}
              </span>
            </AdminCell>
            <AdminCell>
              <span safe>{`${c.eac.violations} violations, ${c.eac.kicks} kicks`}</span>
              {c.eac.sanction && <div class="text-xs text-red-400">banned</div>}
            </AdminCell>
            <AdminCell>
              <span safe>{format(c.last_report, 'dd.MM.yyyy HH:mm')}</span>
            </AdminCell>
            <AdminCell>
              <span safe>{c.status}</span>
            </AdminCell>
          </tr>
        ))}
      </AdminTable>
      {props.cases.length === 0 && (
        <p class="text-abru-light-50 px-4 py-8 text-center">No reports.</p>
      )}
    </>
  )
}
