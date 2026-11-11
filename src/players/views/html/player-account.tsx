import { format, formatDistanceToNow } from 'date-fns'
import { gc } from '../../../gc'
import type { z } from 'zod'
import type { gcSchemas } from '../../../gc/schemas'
import { IconBan, IconCheck, IconHeart } from '../../../html/components/icons'
import type { SteamId64 } from '../../../shared/types/steam-id-64'

type Quest = z.infer<typeof gcSchemas.quests>['daily'][number]

// "In one match" quests (per) count matches where the player reached per.
const onePer = (q: Quest, what: string) =>
  q.target > 1 ? `${q.target} times get ${q.per} ${what} in one match` : `Get ${q.per} ${what} in one match`

const questText: Record<string, (q: Quest) => string> = {
  kills: q => (q.per ? onePer(q, 'kills') : `Get ${q.target} kills`),
  damage: q => (q.per ? onePer(q, 'damage') : `Deal ${q.target} damage`),
  healing: q => (q.per ? onePer(q, 'healing') : `Heal ${q.target} health`),
  support: q => `Earn ${q.target} support points`,
  score: q => (q.per ? onePer(q, 'points') : `Score ${q.target} points`),
  wins: q => `Win ${q.target} matches`,
  matches: q => `Finish ${q.target} matches`,
  war_wins: q => `Win ${q.target} war battles`,
  class_wins: q => `Win ${q.target > 1 ? `${q.target} matches` : 'a match'} as ${q.class ?? 'any class'}`,
  class_play: q => `Play a match as ${q.class ?? 'any class'}`,
  medals: q => `Earn ${q.target} medals`,
  gold_medals: q => `Earn ${q.target} gold medal${q.target > 1 ? 's' : ''}`,
  party_wins: q => `Win ${q.target} matches with your party`,
  positive_kd: q => `Finish ${q.target} matches with more kills than deaths`,
  clan_matches: q => `Play ${q.target} matches with a clanmate`,
}

// The private part of the player's own profile: what the coordinator knows
// about their account that nobody else sees.
export async function PlayerAccount(props: { steamId: SteamId64 }) {
  const [record, quests, payments] = await Promise.all([
    gc.antiCheatRecord(props.steamId).catch(() => null),
    gc.quests(props.steamId).catch(() => null),
    gc.payments().catch(() => null),
  ])
  const sanction = record?.sanction
  const sanctionActive = sanction && (!sanction.until || sanction.until > new Date())
  const orders = (payments?.orders ?? []).filter(o => o.steam_id === props.steamId)

  return (
    <details
      id="player-account"
      class="admin-toolbox-details"
      data-details-persist="player-account"
      open
    >
      <summary class="admin-toolbox-summary">
        <span>Your account</span>
      </summary>

      <div class="player-admin-toolbox">
        <div class="admin-toolbox-header">
          {sanctionActive ? (
            <div class="flex min-w-0 flex-1 items-center gap-3 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-300">
              <IconBan size={16} class="shrink-0" />
              <div class="flex min-w-0 flex-col">
                <span>
                  You cannot queue{' '}
                  {sanction.until ? (
                    <>
                      until <strong safe>{format(sanction.until, 'MMM dd, yyyy, HH:mm')}</strong>
                    </>
                  ) : (
                    'until the ban is lifted'
                  )}
                </span>
                <span class="text-red-300/70" safe>
                  {sanction.reason}
                </span>
              </div>
            </div>
          ) : (
            <div class="bg-abru-light-5 text-abru-light-50 flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm">
              <IconCheck size={16} class="shrink-0" />
              <span>Your account is in good standing: you can queue for matches.</span>
            </div>
          )}
          {record?.steam_ban && (
            <div class="flex items-center gap-3 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-300">
              <IconBan size={16} class="shrink-0" />
              <span>Steam game ban</span>
            </div>
          )}
        </div>

        {quests && (
          <>
            <div class="admin-toolbox-divider" />
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <QuestList title="Daily quests" ends={quests.daily_ends} quests={quests.daily} />
              <QuestList title="Weekly quest" ends={quests.weekly_ends} quests={quests.weekly} />
            </div>
          </>
        )}

        {orders.length > 0 && (
          <>
            <div class="admin-toolbox-divider" />
            <h4 class="caption flex items-center gap-2">
              <IconHeart size={16} /> Thank you for supporting the project
            </h4>
            <table class="text-abru-light-75 w-full text-left text-sm">
              <tbody>
                {orders.map(order => (
                  <tr>
                    <td class="px-2 py-1" safe>
                      {format(order.opened, 'dd.MM.yyyy')}
                    </td>
                    <td class="px-2 py-1">{order.kind === 'monthly' ? 'Monthly' : 'One-off'}</td>
                    <td class="px-2 py-1 tabular-nums" safe>
                      {`${(order.amount / 100).toFixed(2)} ${order.currency}`}
                    </td>
                    <td class="px-2 py-1">
                      {order.refunded
                        ? 'refunded'
                        : order.paid
                          ? 'paid'
                          : order.failed
                            ? 'not completed'
                            : 'pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </details>
  )
}

function QuestList(props: { title: string; ends: Date; quests: Quest[] }) {
  return (
    <div class="flex flex-col gap-2">
      <h4 class="caption">
        {props.title}{' '}
        <span class="text-abru-light-50 text-sm font-normal" safe>
          (renew {formatDistanceToNow(props.ends, { addSuffix: true })})
        </span>
      </h4>
      {props.quests.map(q => (
        <div class="text-abru-light-75 flex flex-col gap-1">
          <div class="flex flex-row justify-between gap-2 text-sm">
            <span class={q.done ? 'line-through' : undefined} safe>
              {questText[q.kind]?.(q) ?? q.id}
            </span>
            <span class="tabular-nums" safe>
              {`${Math.min(q.progress, q.target)}/${q.target} · ${q.xp} XP`}
            </span>
          </div>
          <progress
            class="accent-accent h-1 w-full"
            max={q.target}
            value={Math.min(q.progress, q.target)}
          ></progress>
        </div>
      ))}
    </div>
  )
}
