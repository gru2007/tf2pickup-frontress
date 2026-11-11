import { formatDistanceToNowStrict } from 'date-fns'
import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { PlayerLink } from '../../../../html/components/player-link'
import { MatchGroupSettings } from './match-group-settings'

// Running matches, who stands in which queue, and the queues themselves.
// Below them, the queues' settings, saved to the coordinator.
export async function GamesPage() {
  const [live, settings] = await Promise.all([gc.live(), gc.settings()])
  const groups = live.status?.groups ?? []
  const groupName = new Map(groups.map(g => [String(g.match_group), g.name]))
  return (
    <Admin activePage="games">
      <div class="admin-panel-set">
        <h4 class="pb-4">Running games</h4>
        <div class="max-lg:overflow-x-auto">
          <AdminTable head={['Game', 'Queue', 'Map', 'State', 'Server', 'Players', 'Running for']}>
            {live.matches.map(match => (
              <tr>
                <AdminCell bold>
                  <a href={`/games/${match.match_id}`} class="underline" safe>
                    {match.match_id}
                  </a>
                </AdminCell>
                <AdminCell>
                  <span safe>
                    {match.kind === 'war'
                      ? `war · ${match.sector ?? match.group_name}`
                      : match.group_name}
                  </span>
                </AdminCell>
                <AdminCell>
                  <span safe>{match.map}</span>
                </AdminCell>
                <AdminCell>
                  <span safe>{match.state}</span>
                </AdminCell>
                <AdminCell>
                  <span safe>{match.server || '—'}</span>
                </AdminCell>
                <AdminCell>
                  <span
                    safe
                  >{`${match.members.filter(m => m.connect === 'connected').length}/${match.members.length} connected`}</span>
                </AdminCell>
                <AdminCell>
                  <span safe>{formatDistanceToNowStrict(match.started_at ?? match.formed_at)}</span>
                </AdminCell>
              </tr>
            ))}
          </AdminTable>
          {live.matches.length === 0 && (
            <p class="text-abru-light-75 mt-4 italic">No game is running.</p>
          )}
        </div>
      </div>

      <div class="admin-panel-set mt-4">
        <h4 class="pb-4">Queues</h4>
        <AdminTable
          head={['Queue', 'Mode', 'Searching', 'Needed', 'Ideal', 'Max', 'Running', 'Maps']}
        >
          {groups.map(group => (
            <tr>
              <AdminCell bold>
                <span safe>{group.name}</span>
              </AdminCell>
              <AdminCell>
                <span safe>{group.mode}</span>
              </AdminCell>
              <AdminCell>{group.queued}</AdminCell>
              <AdminCell>{group.need}</AdminCell>
              <AdminCell>{group.ideal}</AdminCell>
              <AdminCell>{group.max}</AdminCell>
              <AdminCell>{group.matches}</AdminCell>
              <AdminCell class="text-xs">
                <a href="/admin/map-pool" class="underline" title={(group.maps ?? []).join(', ')}>
                  {`${(group.maps ?? []).length} maps`}
                </a>
              </AdminCell>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div class="admin-panel-set mt-4">
        <h4 class="pb-4">Searching parties</h4>
        <AdminTable head={['Party', 'Players', 'Waiting']}>
          {live.parties.map(party => (
            <tr>
              <AdminCell>
                <span safe>{party.id}</span>
              </AdminCell>
              <AdminCell>
                <div class="flex flex-row flex-wrap gap-x-3">
                  {(party.members ?? []).map(m => (
                    <PlayerLink steamId={m.steam_id} name={m.name} class="underline" />
                  ))}
                </div>
              </AdminCell>
              <AdminCell>
                <span safe>
                  {Object.entries(party.queues)
                    .map(([g, secs]) => `${groupName.get(g) ?? g}: ${Math.round(secs / 60)} min`)
                    .join(', ')}
                </span>
              </AdminCell>
            </tr>
          ))}
        </AdminTable>
        {live.parties.length === 0 && (
          <p class="text-abru-light-75 mt-4 italic">Nobody is searching.</p>
        )}
      </div>
      <MatchGroupSettings settings={settings.settings} />
    </Admin>
  )
}
