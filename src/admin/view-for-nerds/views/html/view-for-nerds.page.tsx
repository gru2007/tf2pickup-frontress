import { format } from 'date-fns'
import { gc } from '../../../../gc'
import { environment } from '../../../../environment'
import { Admin } from '../../../views/html/admin'
import { SettingsForm } from '../../../views/html/settings-form'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { PlayerLink } from '../../../../html/components/player-link'

// Server keys have their own page: their secrets never leave the coordinator.
export const rawSections = [
  'name',
  'match_groups',
  'regions',
  'region_wait_secs',
  'server_ping',
  'anticheat',
  'chat',
  'timing',
  'map_index',
  'webhooks',
] as const

// Every setting the panel manages as the coordinator's JSON, for what the
// other pages have no field for; the history of changes; and the
// coordinator's raw answers.
export async function ViewForNerdsPage() {
  const [{ settings }, history, status, live] = await Promise.all([
    gc.settings(),
    gc.settingsHistory(30),
    gc.status(),
    gc.live(),
  ])
  const fromPanel = new Set(settings.from_panel)
  return (
    <Admin activePage="view-for-nerds">
      <div class="admin-panel-set text-abru-light-75 text-sm">
        <span safe>
          {`Coordinator ${environment.GC_URL} · settings revision ${settings.revision}`}
          {settings.updated_at ? ` · ${format(settings.updated_at, 'dd.MM.yyyy HH:mm')}` : ''}
          {settings.persisted ? '' : ' · not persisted: the coordinator has no data_dir'}
        </span>
        <p class="mt-2">
          Sections saved here live in the coordinator's data/settings.json and override the same
          sections of gc.json.
        </p>
      </div>

      {rawSections.map(section => (
        <SettingsForm
          action={`/admin/view-for-nerds/${section}`}
          revision={settings.revision}
          title={`${section}${fromPanel.has(section) ? ' · from the panel' : ' · from gc.json'}`}
        >
          <textarea
            name="value"
            rows={String(section === 'match_groups' ? 24 : 6)}
            class="w-full font-mono text-xs"
            aria-label={section}
          >
            {JSON.stringify(settings.sections[section] ?? null, null, 2) as 'safe'}
          </textarea>
        </SettingsForm>
      ))}

      <div class="admin-panel-set mt-4 max-lg:overflow-x-auto">
        <h4 class="pb-4">History</h4>
        <AdminTable head={['Revision', 'When', 'By', 'What']}>
          {history.revisions.map(r => (
            <tr>
              <AdminCell bold>{r.revision}</AdminCell>
              <AdminCell>
                <span safe>{r.updated_at ? format(r.updated_at, 'dd.MM.yyyy HH:mm') : ''}</span>
              </AdminCell>
              <AdminCell>
                {r.updated_by && <PlayerLink steamId={r.updated_by} class="underline" />}
              </AdminCell>
              <AdminCell>
                <span safe>{r.note ?? ''}</span>
              </AdminCell>
            </tr>
          ))}
        </AdminTable>
        {history.revisions.length === 0 && (
          <p class="text-abru-light-50 mt-4 italic">Nothing was changed from the panel yet.</p>
        )}
      </div>

      {(
        [
          ['GET /v1/status', status],
          ['GET /admin/v1/live', live],
        ] as const
      ).map(([key, value]) => (
        <details class="admin-panel-set mt-4">
          <summary class="cursor-pointer font-bold" safe>
            {key}
          </summary>
          <pre class="mt-2 max-h-[600px] overflow-auto text-xs">
            {JSON.stringify(value, null, 2) as 'safe'}
          </pre>
        </details>
      ))}
    </Admin>
  )
}
