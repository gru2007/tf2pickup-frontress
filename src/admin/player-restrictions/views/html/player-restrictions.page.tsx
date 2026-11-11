import { format } from 'date-fns'
import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { PlayerLink } from '../../../../html/components/player-link'
import { RestrictionSettings } from './restriction-settings'

// Everybody the coordinator keeps out of matchmaking right now, whether a
// moderator or Easy Anti-Cheat put them there. Queue restrictions (party size,
// minimum matches, abandon cooldowns) and chat follow, saved to the coordinator.
export async function PlayerRestrictionsPage() {
  const [{ sanctions }, settings] = await Promise.all([gc.sanctions(), gc.settings()])
  return (
    <Admin activePage="player-restrictions">
      <div class="admin-panel-set">
        <h4 class="pb-4">Active matchmaking bans</h4>
        <div class="max-lg:overflow-x-auto">
          <AdminTable head={['Player', 'Kind', 'Reason', 'By', 'Since', 'Until']}>
            {(sanctions ?? []).map(record => (
              <tr>
                <AdminCell bold>
                  <a href={`/players/${record.steam_id}/edit/bans`} class="underline" safe>
                    {record.steam_id}
                  </a>
                </AdminCell>
                <AdminCell>
                  <span safe>{record.sanction?.kind ?? ''}</span>
                  {record.steam_ban && <div class="text-xs text-red-400">Steam game ban</div>}
                </AdminCell>
                <AdminCell>
                  <span safe>{record.sanction?.reason ?? ''}</span>
                </AdminCell>
                <AdminCell>
                  {record.sanction?.by.startsWith('admin:') ? (
                    <PlayerLink steamId={record.sanction.by.slice(6)} class="underline" />
                  ) : (
                    <span safe>{record.sanction?.by ?? ''}</span>
                  )}
                </AdminCell>
                <AdminCell>
                  <span safe>
                    {record.sanction ? format(record.sanction.since, 'dd.MM.yyyy HH:mm') : ''}
                  </span>
                </AdminCell>
                <AdminCell>
                  <span safe>
                    {record.sanction?.until
                      ? format(record.sanction.until, 'dd.MM.yyyy HH:mm')
                      : 'until lifted'}
                  </span>
                </AdminCell>
              </tr>
            ))}
          </AdminTable>
          {(sanctions ?? []).length === 0 && (
            <p class="text-abru-light-75 mt-4 italic">Nobody is banned.</p>
          )}
        </div>
      </div>
      <RestrictionSettings settings={settings.settings} />
    </Admin>
  )
}
