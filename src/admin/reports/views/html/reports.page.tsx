import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { ReportCaseList } from './report-case-list'

export async function ReportsPage(props: { status: 'open' | 'closed' | 'all' }) {
  const { cases } = await gc.reportCases(props.status)
  return (
    <Admin activePage="reports">
      <div class="admin-panel-set">
        <div class="mb-4 flex flex-row gap-2">
          {(['open', 'closed', 'all'] as const).map(status => (
            <a
              href={`/admin/reports?status=${status}`}
              class="button"
              data-size="dense"
              data-variant={props.status === status ? 'accent' : undefined}
            >
              {status}
            </a>
          ))}
        </div>
        <div class="max-lg:overflow-x-auto" id="report-results">
          <ReportCaseList cases={cases ?? []} />
        </div>
      </div>
    </Admin>
  )
}
