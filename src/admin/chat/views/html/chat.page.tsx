import { format, fromUnixTime } from 'date-fns'
import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { AdminTable, AdminCell } from '../../../views/html/admin-table'

export async function ChatPage(props: {
  source: 'all' | 'menu' | 'match'
  steamId: string
  q: string
  before?: number | undefined
}) {
  const data = await gc.chatModeration({
    source: props.source,
    steam_id: props.steamId,
    q: props.q,
    ...(props.before === undefined ? {} : { before: props.before }),
  })
  const muted = new Set(data.muted_steam_ids ?? [])
  const older = new URLSearchParams({
    source: props.source,
    steamId: props.steamId,
    q: props.q,
    before: String(data.next),
  })
  return (
    <Admin activePage="chat">
      <section class="admin-panel-set flex flex-col gap-4">
        {data.disabled && <p>Text chat is globally disabled in coordinator settings.</p>}
        <p>
          Menu chat (global, clan and party) and match chat (all and team). Mutes apply to text chat
          in both places until lifted.
        </p>
        <p class="text-sm">
          This page shows messages retained by the running GC. Private evidence and moderator
          decisions remain in the{' '}
          <a class="underline" href="/admin/logs">
            journal
          </a>
          . Removing a match record cannot erase text already printed in players' HUD or console.
        </p>
        <form
          method="get"
          action="/admin/chat"
          class="flex flex-wrap items-end gap-3"
          hx-boost="false"
        >
          <label>
            Source{' '}
            <select name="source">
              <option value="all" selected={props.source === 'all'}>
                All
              </option>
              <option value="menu" selected={props.source === 'menu'}>
                Menu
              </option>
              <option value="match" selected={props.source === 'match'}>
                Matches
              </option>
            </select>
          </label>
          <label>
            Player SteamID64 <input name="steamId" value={props.steamId} pattern="[0-9]{17}" />
          </label>
          <label>
            Search <input name="q" value={props.q} maxlength="200" />
          </label>
          <button class="button" type="submit">
            Search / refresh
          </button>
        </form>
        <form
          action="/admin/chat/players"
          method="post"
          class="flex flex-wrap items-end gap-3"
          hx-boost="false"
        >
          <label>
            Player SteamID64{' '}
            <input name="steamId" value={props.steamId} required pattern="[0-9]{17}" />
          </label>
          <label>
            Action{' '}
            <select name="action">
              <option value="mute">Mute in menu and matches</option>
              <option value="unmute">Unmute</option>
              <option value="clear_chat">Remove all retained messages by this player</option>
            </select>
          </label>
          <label>
            Reason <input name="reason" required maxlength="300" />
          </label>
          <button class="button" type="submit" data-variant="accent">
            Apply
          </button>
        </form>
        <details>
          <summary>Muted players</summary>
          {[...muted].map(id => (
            <p>
              <a class="underline" href={`/admin/chat?steamId=${id}`} safe>
                {id}
              </a>
            </p>
          ))}
        </details>
        <details open={data.servers.some(server => !server.synced)}>
          <summary>Game server moderation status</summary>
          {data.servers.length === 0 && <p>No game servers connected.</p>}
          {data.servers.map(server => (
            <p
              safe
            >{`${server.name || server.steam_id}: ${server.synced ? 'current policy confirmed' : 'awaiting current policy — server must run the updated game binary'}`}</p>
          ))}
        </details>
      </section>
      <section class="admin-panel-set max-lg:overflow-x-auto">
        {data.lines.length === 0 && <p>No retained messages match the filter.</p>}
        <AdminTable head={['Time / channel', 'Player', 'Message', 'Moderation']}>
          {data.lines.map(line => (
            <tr>
              <AdminCell>
                <span safe>{format(fromUnixTime(line.at), 'dd.MM.yyyy HH:mm:ss')}</span>
                <br />
                <span safe>{`${line.source} · ${line.ch} · ${line.channel}`}</span>
                {line.match !== undefined && (
                  <p>
                    <a
                      class="underline"
                      href={`/games/${line.match}`}
                      safe
                    >{`Match ${line.match}`}</a>
                  </p>
                )}
              </AdminCell>
              <AdminCell>
                {line.from !== undefined ? (
                  <>
                    <a
                      class="underline"
                      href={`/admin/chat?steamId=${line.from}`}
                      safe
                    >{`${line.tag ? `[${line.tag}] ` : ''}${line.name ?? line.from}`}</a>
                    <p safe>{line.from}</p>
                    {muted.has(line.from) && <p>Muted</p>}
                  </>
                ) : (
                  <span>System</span>
                )}
              </AdminCell>
              <AdminCell>
                <p class="max-w-xl break-words whitespace-pre-wrap" safe>
                  {line.text ?? [line.key, ...(line.args ?? [])].join(' ')}
                </p>
              </AdminCell>
              <AdminCell>
                <details>
                  <summary>Actions</summary>
                  <form
                    method="post"
                    action={`/admin/chat/messages/${line.id}`}
                    class="flex flex-col gap-2"
                    hx-boost="false"
                  >
                    <input type="hidden" name="epoch" value={data.epoch} />
                    <input name="reason" placeholder="Reason" required maxlength="300" />
                    <button type="submit" class="button">
                      {line.source === 'match' ? 'Remove retained record' : 'Delete message'}
                    </button>
                  </form>
                  {line.from !== undefined && (
                    <form
                      method="post"
                      action="/admin/chat/players"
                      class="mt-3 flex flex-col gap-2"
                      hx-boost="false"
                    >
                      <input type="hidden" name="steamId" value={line.from} />
                      <input
                        type="hidden"
                        name="action"
                        value={muted.has(line.from) ? 'unmute' : 'mute'}
                      />
                      <input name="reason" placeholder="Reason" required maxlength="300" />
                      <button type="submit" class="button">
                        {muted.has(line.from) ? 'Unmute player' : 'Mute player in both chats'}
                      </button>
                    </form>
                  )}
                </details>
              </AdminCell>
            </tr>
          ))}
        </AdminTable>
        {data.next > 0 && (
          <a class="button mt-4" href={`/admin/chat?${older.toString()}`}>
            Older messages
          </a>
        )}
      </section>
    </Admin>
  )
}
