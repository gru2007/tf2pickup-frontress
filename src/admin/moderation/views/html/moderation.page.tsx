import { format } from 'date-fns'
import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { AdminTable, AdminCell } from '../../../views/html/admin-table'

export async function ModerationPage(props: { steamId?: string | undefined; q: string }) {
  const data = await gc.clanModeration()
  const { moderation } = data
  const q = props.q.trim().toLowerCase()
  const clans = data.clans.filter(clan =>
    [clan.name, clan.tag, clan.id, ...clan.members.flatMap(m => [m.name, m.steam_id])].some(value =>
      value.toLowerCase().includes(q),
    ),
  )
  const banned = moderation.creation_bans.find(ban => ban.steam_id === props.steamId)
  const muted = (data.muted_steam_ids ?? []).includes(props.steamId ?? '')
  return (
    <Admin activePage="moderation">
      {!moderation.persisted && (
        <p class="admin-panel-set text-red-300">
          Clan moderation is in memory. Configure persistent GC clan storage before relying on
          restrictions across restarts.
        </p>
      )}
      <section class="admin-panel-set flex flex-col gap-4">
        <h4>Player restrictions</h4>
        <form method="get" action="/admin/moderation" class="flex flex-wrap gap-2" hx-boost="false">
          <label>
            SteamID64{' '}
            <input name="steamId" value={props.steamId ?? ''} required pattern="[0-9]{17}" />
          </label>
          <button class="button" type="submit">
            Find player
          </button>
        </form>
        {props.steamId !== undefined && (
          <>
            <p
              safe
            >{`SteamID ${props.steamId} · Clan creation: ${banned ? 'restricted' : 'allowed'} · Chat: ${muted ? 'muted' : 'allowed'}`}</p>
            {banned !== undefined && <p safe>{`Restriction reason: ${banned.reason}`}</p>}
            <p>
              <a class="underline" href={`/players/${props.steamId}`}>
                Profile
              </a>
              {' · '}
              <a class="underline" href={`/players/${props.steamId}/edit/bans`}>
                Matchmaking and Steam bans
              </a>
              {' · '}
              <a class="underline" href={`/admin/logs?player=${props.steamId}`}>
                Logs
              </a>
            </p>
          </>
        )}
        <form
          action="/admin/moderation/players"
          method="post"
          class="flex flex-wrap items-end gap-3"
          hx-boost="false"
        >
          <label>
            SteamID64{' '}
            <input name="steamId" value={props.steamId ?? ''} required pattern="[0-9]{17}" />
          </label>
          <label>
            Action{' '}
            <select name="action">
              <option value="restrict_creation">Forbid creating clans</option>
              <option value="allow_creation">Allow creating clans</option>
              <option value="mute">Mute text chat in menu and matches</option>
              <option value="unmute">Unmute text chat</option>
              <option value="clear_chat">Delete retained messages</option>
            </select>
          </label>
          <label>
            Reason <input name="reason" required maxlength="300" />
          </label>
          <button type="submit" class="button" data-variant="accent">
            Apply restriction
          </button>
        </form>
        <p class="text-sm">
          <a class="underline" href="/admin/chat">
            View chat and moderate individual messages.
          </a>{' '}
          Restrictions last until lifted. A clan creation restriction allows joining other clans.
          Chat decisions are recorded in{' '}
          <a class="underline" href="/admin/view-for-nerds">
            settings history
          </a>
          .
        </p>
        <details>
          <summary>Players forbidden from creating clans</summary>
          {moderation.creation_bans.length === 0 && <p>No restrictions.</p>}
          {moderation.creation_bans.map(ban => (
            <p>
              <a class="underline" href={`/admin/moderation?steamId=${ban.steam_id}`} safe>
                {ban.steam_id}
              </a>
              {' — '}
              <span safe>{ban.reason}</span>
            </p>
          ))}
        </details>
        <details>
          <summary>Muted players</summary>
          {(data.muted_steam_ids ?? []).map(id => (
            <p>
              <a class="underline" href={`/admin/moderation?steamId=${id}`} safe>
                {id}
              </a>
            </p>
          ))}
        </details>
      </section>
      <section class="admin-panel-set flex flex-col gap-4">
        <h4>Active clans</h4>
        <form action="/admin/moderation" method="get" class="flex gap-2" hx-boost="false">
          <input name="q" value={props.q} placeholder="Clan, tag, member or SteamID" />
          <button class="button" type="submit">
            Search
          </button>
        </form>
        {clans.length === 0 && <p>No clans found.</p>}
        {clans.map(clan => (
          <details class="border-ash/20 border-b pb-4">
            <summary
              safe
            >{`[${clan.tag}] ${clan.name} · ${clan.members.length} members · ${clan.id}`}</summary>
            <p
              class="py-2"
              safe
            >{`Motto: ${clan.motto} · Emblem: ${clan.emblem} · Color: ${clan.color}`}</p>
            <ul class="mb-4">
              {clan.members.map(member => (
                <li>
                  <a
                    class="underline"
                    href={`/admin/moderation?steamId=${member.steam_id}`}
                    safe
                  >{`${member.name || member.steam_id} (${member.role}) · ${member.steam_id}`}</a>
                </li>
              ))}
            </ul>
            <form
              action={`/admin/moderation/clans/${clan.id}/tag`}
              method="post"
              class="mb-4 flex flex-wrap items-end gap-3"
              hx-boost="false"
            >
              <label>
                New tag <input name="tag" value={clan.tag} required minlength="2" maxlength="5" />
              </label>
              <label>
                Reason <input name="reason" required maxlength="300" />
              </label>
              <button class="button" type="submit">
                Change tag
              </button>
              <p class="w-full text-sm">
                Changes the tag immediately and keeps the clan, its members and progress.
              </p>
            </form>
            <form
              action={`/admin/moderation/clans/${clan.id}`}
              method="post"
              class="flex flex-col items-start gap-3"
              hx-boost="false"
            >
              <label>
                Action{' '}
                <select name="action">
                  <option value="ban">Ban and delete (reserve name and tag)</option>
                  <option value="delete">Delete only</option>
                </select>
              </label>
              <label>
                Reason <input name="reason" required maxlength="300" />
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="restrict_members" />
                Also forbid all current members from creating new clans until lifted
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="confirm" value="yes" required />I confirm permanently
                deleting this clan, its invitations and progress
              </label>
              <button type="submit" class="button" data-variant="accent">
                Delete clan and apply selected restrictions
              </button>
            </form>
          </details>
        ))}
      </section>
      <section class="admin-panel-set flex flex-col gap-4">
        <h4>Banned clan identities</h4>
        <p>
          Unbanning releases the name and tag. It does not restore a deleted clan or lift player
          restrictions.
        </p>
        {moderation.banned_clans.length === 0 && <p>No banned clans.</p>}
        {moderation.banned_clans.map(ban => (
          <details>
            <summary safe>{`[${ban.tag}] ${ban.name} · ${ban.clan}`}</summary>
            <p safe>{ban.reason}</p>
            <form
              action={`/admin/moderation/clans/${ban.clan}`}
              method="post"
              class="flex flex-wrap items-center gap-3"
              hx-boost="false"
            >
              <input type="hidden" name="action" value="unban" />
              <label>
                Reason <input name="reason" required maxlength="300" />
              </label>
              <label>
                <input type="checkbox" name="confirm" value="yes" required />
                Confirm releasing this name and tag
              </label>
              <button class="button" type="submit">
                Lift clan ban
              </button>
            </form>
          </details>
        ))}
      </section>
      <section class="admin-panel-set max-lg:overflow-x-auto">
        <h4 class="mb-4">Recent clan moderation decisions (up to 200)</h4>
        <AdminTable head={['When / moderator', 'Action / target', 'Reason / affected roster']}>
          {moderation.history.map(entry => (
            <tr>
              <AdminCell>
                <span safe>{format(entry.at, 'dd.MM.yyyy HH:mm')}</span>
                <br />
                <span safe>{entry.actor}</span>
              </AdminCell>
              <AdminCell>
                <span safe>{entry.action}</span>
                {entry.new_tag !== undefined && <p safe>{`${entry.tag} → ${entry.new_tag}`}</p>}
                <br />
                <span safe>
                  {entry.steam_id ?? `${entry.name ?? ''} [${entry.tag ?? ''}] ${entry.clan ?? ''}`}
                </span>
              </AdminCell>
              <AdminCell>
                <p safe>{entry.reason}</p>
                {entry.restrict_members && (
                  <p>Clan creation forbidden for all members listed below.</p>
                )}
                {entry.members !== undefined && (
                  <details>
                    <summary>Roster at deletion</summary>
                    {entry.members.map(m => (
                      <p safe>{`${m.name} · ${m.steam_id} · ${m.role}`}</p>
                    ))}
                  </details>
                )}
              </AdminCell>
            </tr>
          ))}
        </AdminTable>
      </section>
    </Admin>
  )
}
