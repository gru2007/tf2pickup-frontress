import { format } from 'date-fns'
import { gc } from '../../../../gc'
import type { GcJournalEntry } from '../../../../gc/schemas'
import { Admin } from '../../../views/html/admin'
import { AdminCell, AdminTable } from '../../../views/html/admin-table'
import { PlayerLink } from '../../../../html/components/player-link'

export interface LogFilter {
  player?: string | undefined
  server?: string | undefined
  match?: string | undefined
  q?: string | undefined
  level?: string | undefined
  before?: number | undefined
}

const levelClass: Record<string, string> = {
  error: 'text-red-400',
  warn: 'text-alert',
  info: 'text-abru-light-75',
  debug: 'text-abru-light-50',
}

// Attributes already shown in their own column.
const shown = new Set(['steamid', 'server', 'match', 'lobby'])

function link(filter: LogFilter) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `/admin/logs?${s}` : '/admin/logs'
}

// What the coordinator logged about players, servers and matches: sign-ins
// (with the address), parties, queues, chat, matches, reports, bans and
// every server's connects and heartbeats.
export async function LogsPage(props: { filter: LogFilter }) {
  const { filter } = props
  const page = await gc.journal({
    steamId: filter.player,
    server: filter.server,
    match: filter.match,
    q: filter.q,
    level: filter.level,
    before: filter.before,
    limit: 100,
  })
  return (
    <Admin activePage="logs">
      <form method="get" action="/admin/logs" class="admin-panel-set mb-4">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            type="text"
            name="player"
            value={filter.player ?? ''}
            placeholder="Player SteamID64"
          />
          <input
            type="text"
            name="server"
            value={filter.server ?? ''}
            placeholder="Server SteamID"
          />
          <input
            type="text"
            name="match"
            value={filter.match ?? ''}
            placeholder="Match or lobby ID"
          />
          <input
            type="text"
            name="q"
            value={filter.q ?? ''}
            placeholder="Text (name, IP, map...)"
          />
          <select name="level">
            {['debug', 'info', 'warn', 'error'].map(level => (
              <option value={level} selected={(filter.level ?? 'debug') === level}>
                {level === 'debug' ? 'everything' : `${level} and up`}
              </option>
            ))}
          </select>
          <button type="submit" class="button" data-size="dense" data-variant="accent">
            Filter
          </button>
        </div>
      </form>

      <div class="admin-panel-set max-lg:overflow-x-auto">
        {page.dropped > 0 && (
          <div class="banner mb-4" data-tone="alert" safe>
            {`${page.dropped} entries were dropped since the coordinator started: the disk fell behind.`}
          </div>
        )}
        <AdminTable head={['When', 'Event', 'Players', 'Server', 'Match', 'Details']}>
          {page.entries.map(entry => (
            <LogRow entry={entry} filter={filter} />
          ))}
        </AdminTable>
        {page.entries.length === 0 && (
          <p class="text-abru-light-50 px-4 py-8 text-center">Nothing logged.</p>
        )}
        <div class="mt-4 flex flex-row gap-2">
          {filter.before !== undefined && (
            <a href={link({ ...filter, before: undefined })} class="button" data-size="dense">
              Newest
            </a>
          )}
          {page.next > 0 && (
            <a href={link({ ...filter, before: page.next })} class="button" data-size="dense">
              Older
            </a>
          )}
        </div>
      </div>
    </Admin>
  )
}

function LogRow(props: { entry: GcJournalEntry; filter: LogFilter }) {
  const { entry, filter } = props
  const attrs = Object.entries(entry.attrs ?? {}).filter(([key]) => !shown.has(key))
  const match = entry.match ?? entry.lobby
  return (
    <tr class={levelClass[entry.level]}>
      <AdminCell class="text-xs whitespace-nowrap">
        <span safe>{format(entry.at, 'dd.MM.yyyy HH:mm:ss')}</span>
      </AdminCell>
      <AdminCell bold>
        <span safe>{entry.msg}</span>
      </AdminCell>
      <AdminCell>
        <div class="flex flex-col">
          {(entry.players ?? []).map(id => (
            <span class="whitespace-nowrap">
              <a href={link({ ...filter, player: id, before: undefined })} class="underline" safe>
                {id}
              </a>{' '}
              <PlayerLink steamId={id} name="↗" class="text-abru-light-50" />
            </span>
          ))}
        </div>
      </AdminCell>
      <AdminCell>
        {entry.server && (
          <a
            href={link({ ...filter, server: entry.server, before: undefined })}
            class="underline"
            safe
          >
            {entry.server}
          </a>
        )}
      </AdminCell>
      <AdminCell>
        {match && (
          <a href={link({ ...filter, match, before: undefined })} class="underline" safe>
            {match}
          </a>
        )}
      </AdminCell>
      <AdminCell class="font-mono text-xs break-all">
        <span safe>{attrs.map(([k, v]) => `${k}=${v}`).join('  ')}</span>
      </AdminCell>
    </tr>
  )
}
