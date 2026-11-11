import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns'
import { requestContext } from '@fastify/request-context'
import { gc } from '../../../../gc'
import { IconCheck, IconLogs, IconMinus, IconX } from '../../../../html/components/icons'
import { Admin } from '../../../views/html/admin'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { PlayerRole } from '../../../../auth/player-role'
import { CheckboxSetting, TextSetting } from '../../../views/html/setting-field'
import { SaveButton } from '../../../views/html/save-button'
import { firstNonEmpty } from '../../../../utils/first-non-empty'

const stateLabel: Record<string, string> = {
  free: 'free',
  busy: 'in a match',
  resting: 'resting after a match',
  not_ready: 'not ready',
  offline: 'offline',
}

// The pool: every dedicated server connected to the coordinator, and the keys
// they connect with. A new server needs a key from here and joins on its own.
export async function GameServersPage() {
  const [live, { keys }] = await Promise.all([gc.live(), gc.serverKeys()])
  const keyName = new Map(keys.map(k => [k.key_id, k.name]))
  const user = requestContext.get('user')
  const canEdit = user?.player.roles.includes(PlayerRole.superUser) ?? false
  return (
    <Admin activePage="game-servers">
      <div class="admin-panel-set">
        <h4 class="pb-4">
          Pool: {live.servers.filter(s => s.state !== 'offline').length} connected,{' '}
          {live.servers.filter(s => s.state === 'free').length} free
        </h4>
        <div class="max-lg:overflow-x-auto">
          <AdminTable
            id="admin-panel-game-server-list"
            head={['Name', 'Key', 'Region', 'Address', 'Map', 'EAC', 'State', 'Game', '']}
          >
            {live.servers.map(server => (
              <tr>
                <AdminCell bold>
                  <span safe>{server.name}</span>
                  <div class="text-abru-light-50 text-xs font-normal" safe>
                    {[
                      server.connected_at
                        ? `up ${formatDistanceToNowStrict(server.connected_at)}`
                        : '',
                      server.last_status
                        ? `heartbeat ${formatDistanceToNow(server.last_status, { addSuffix: true })}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </AdminCell>
                <AdminCell>
                  <span safe>{keyName.get(server.key_id ?? '') ?? server.community}</span>
                </AdminCell>
                <AdminCell>
                  <span class="uppercase" safe>
                    {server.region || '—'}
                  </span>
                </AdminCell>
                <AdminCell>
                  <span safe>{server.connect}</span>
                </AdminCell>
                <AdminCell>
                  <span safe>{server.map}</span>
                </AdminCell>
                <AdminCell>
                  {server.protected ? (
                    <IconCheck class="text-green-600" />
                  ) : (
                    <IconX class="text-red-600" />
                  )}
                </AdminCell>
                <AdminCell>
                  <span safe>{stateLabel[server.state] ?? server.state}</span>
                </AdminCell>
                <AdminCell>
                  {server.match_id ? (
                    <a href={`/games/${server.match_id}`} class="underline" safe>
                      {`${server.match_id} · ${server.players} in`}
                    </a>
                  ) : (
                    <IconMinus />
                  )}
                </AdminCell>
                <AdminCell>
                  <a href={`/admin/logs?server=${server.steam_id}`} title="Server log">
                    <IconLogs size={20} />
                  </a>
                </AdminCell>
              </tr>
            ))}
          </AdminTable>
          {live.servers.length === 0 && (
            <p class="text-abru-light-75 mt-4 italic">
              No server is connected. Make a key below and put it in the server's server.cfg.
            </p>
          )}
        </div>
      </div>

      <div class="admin-panel-set mt-4">
        <h4 class="pb-4">Server keys</h4>
        <p class="text-abru-light-75 mb-4 text-sm">
          A key lets servers join the pool. Give each community (or each machine) its own, so it can
          be told apart and cut off alone. Rotating or revoking a key disconnects the servers that
          use it; a match they host ends on the server-lost deadline.
        </p>
        <div class="max-lg:overflow-x-auto">
          <AdminTable
            head={['Name', 'Community', 'Region', 'EAC authority', 'Servers', 'From', '']}
          >
            {keys.map(key => (
              <tr>
                <AdminCell bold>
                  <span safe>{key.name}</span>
                  <div class="text-abru-light-50 text-xs font-normal" safe>
                    {`id ${key.key_id}`}
                  </div>
                </AdminCell>
                <AdminCell>
                  <span safe>{key.community ?? ''}</span>
                </AdminCell>
                <AdminCell>
                  <span class="uppercase" safe>
                    {firstNonEmpty(key.region) ?? 'any'}
                  </span>
                </AdminCell>
                <AdminCell>
                  {key.anticheat_authority ? <IconCheck class="text-green-600" /> : <IconMinus />}
                </AdminCell>
                <AdminCell>
                  <span safe>
                    {`${key.servers.filter(s => s.state !== 'offline').length} connected`}
                  </span>
                </AdminCell>
                <AdminCell>
                  <span safe>{key.source}</span>
                </AdminCell>
                <AdminCell>
                  {canEdit && key.source !== 'env' && (
                    <div class="flex flex-row gap-2">
                      <form
                        action={`/admin/game-servers/keys/${encodeURIComponent(key.name)}/rotate`}
                        method="post"
                        hx-boost="false"
                        onsubmit="return confirm('Make a new key? Servers using the old one are disconnected.')"
                      >
                        <button type="submit" class="button" data-size="dense">
                          Rotate
                        </button>
                      </form>
                      <form
                        action={`/admin/game-servers/keys/${encodeURIComponent(key.name)}/revoke`}
                        method="post"
                        hx-boost="false"
                        onsubmit="return confirm('Revoke this key? Its servers are disconnected and refused.')"
                      >
                        <button type="submit" class="button" data-size="dense">
                          Revoke
                        </button>
                      </form>
                    </div>
                  )}
                </AdminCell>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>

      {canEdit && (
        <form
          action="/admin/game-servers/keys"
          method="post"
          class="admin-panel-set mt-4"
          hx-boost="false"
        >
          <h4 class="pb-4">Add a server key</h4>
          <div class="flex flex-col gap-4">
            <TextSetting
              id="key-name"
              name="name"
              label="Name"
              value=""
              placeholder="eu-02"
              description="Shown in the pool and the logs."
            />
            <TextSetting id="key-community" name="community" label="Community" value="frontress" />
            <TextSetting
              id="key-region"
              name="region"
              label="Region"
              value=""
              placeholder="eu"
              description="The region of the servers using it, unless they say their own (tf_gc_server_region)."
            />
            <CheckboxSetting
              id="key-authority"
              name="anticheat_authority"
              label="Anti-cheat authority"
              checked={false}
              description="EAC bans these servers report keep players out of matchmaking. Only for servers you run."
            />
            <div>
              <SaveButton />
            </div>
          </div>
        </form>
      )}
    </Admin>
  )
}
