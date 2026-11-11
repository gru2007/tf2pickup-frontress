import { resolve } from 'node:path'
import { Layout } from '../../../html/layout'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminPanelLink,
  AdminPanelSection,
  AdminPanelSidebar,
} from '../../../html/components/admin-panel'
import {
  IconAlertSquareRounded,
  IconArrowBackUp,
  IconBan,
  IconPlus,
  IconX,
} from '../../../html/components/icons'
import type { Children } from '@kitajs/html'
import { format } from 'date-fns'
import { makeTitle } from '../../../html/make-title'
import type { SteamId64 } from '../../../shared/types/steam-id-64'
import { gc } from '../../../gc'
import type { z } from 'zod'
import type { gcSchemas } from '../../../gc/schemas'
import { PlayerLink } from '../../../html/components/player-link'
import { firstNonEmpty } from '../../../utils/first-non-empty'

const editPlayerPages = {
  '/bans': 'Bans',
  '/reports': 'Reports',
} as const

async function playerName(steamId: SteamId64) {
  return firstNonEmpty((await gc.player(steamId).catch(() => null))?.name) ?? steamId
}

export async function EditPlayerBansPage(props: { steamId: SteamId64 }) {
  const [name, record] = await Promise.all([
    playerName(props.steamId),
    gc.antiCheatRecord(props.steamId),
  ])
  const sanction = record.sanction
  const sanctionActive = sanction && (!sanction.until || sanction.until > new Date())
  const events = record.events ?? []
  return (
    <EditPlayer
      steamId={props.steamId}
      name={name}
      activePage="/bans"
      action={
        <a href={`/players/${props.steamId}/edit/bans/add`} class="button" data-variant="accent">
          <IconPlus />
          Add ban
        </a>
      }
    >
      <div class="admin-panel-content">
        <div class="edit-player-ban-list">
          {sanction && (
            <BanDetails
              steamId={props.steamId}
              id="sanction"
              title={sanction.reason}
              by={sanction.by}
              start={sanction.since}
              end={sanction.until}
              revoke={sanctionActive ? 'clear' : undefined}
            />
          )}
          {record.steam_ban && (
            <BanDetails
              steamId={props.steamId}
              id="steam-ban"
              title={`Steam game ban: ${record.steam_ban.reason}`}
              by={record.steam_ban.by}
              start={record.steam_ban.at}
              end={undefined}
              revoke="steam_unban"
            />
          )}
        </div>
        {!sanction && !record.steam_ban && <span class="text-abru-light-75 italic">No bans</span>}

        {events.length > 0 && (
          <>
            <h4 class="text-abru-light-75 mt-8 mb-2 text-xl font-bold">History</h4>
            <table class="text-abru-light-75 w-full text-left text-sm">
              <thead>
                <tr>
                  <th class="px-2 py-1">Date</th>
                  <th class="px-2 py-1">Event</th>
                  <th class="px-2 py-1">Details</th>
                  <th class="px-2 py-1">Match</th>
                </tr>
              </thead>
              <tbody>
                {events.toReversed().map(event => (
                  <tr>
                    <td class="px-2 py-1 whitespace-nowrap" safe>
                      {format(event.at, 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td class="px-2 py-1" safe>
                      {event.kind}
                    </td>
                    <td class="px-2 py-1" safe>
                      {event.details ?? ''}
                    </td>
                    <td class="px-2 py-1">
                      {event.match_id && (
                        <a href={`/games/${event.match_id}`} class="underline" safe>
                          {event.match_id}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </EditPlayer>
  )
}

export async function EditPlayerReportsPage(props: { steamId: SteamId64 }) {
  const [name, reportCase] = await Promise.all([
    playerName(props.steamId),
    gc.reportCase(props.steamId),
  ])
  return (
    <EditPlayer
      steamId={props.steamId}
      name={name}
      activePage="/reports"
      action={
        reportCase && reportCase.open_reports > 0 ? (
          <div class="flex flex-row gap-2">
            <button
              class="button"
              hx-post={`/players/${props.steamId}/edit/reports/dismiss`}
              hx-prompt="Why are these reports dismissed?"
              hx-target="body"
            >
              <IconX />
              Dismiss
            </button>
            <a
              href={`/players/${props.steamId}/edit/bans/add?reports=1`}
              class="button"
              data-variant="accent"
            >
              <IconBan />
              Ban
            </a>
          </div>
        ) : undefined
      }
    >
      <div class="admin-panel-content">
        {reportCase ? (
          <ReportCaseDetails reportCase={reportCase} />
        ) : (
          <span class="text-abru-light-75 italic">Nobody reported this player</span>
        )}
      </div>
    </EditPlayer>
  )
}

function ReportCaseDetails(props: { reportCase: z.infer<typeof gcSchemas.reportCaseDetail> }) {
  const c = props.reportCase
  return (
    <div class="flex flex-col gap-4">
      <div class="text-abru-light-75 flex flex-row flex-wrap gap-x-6 gap-y-1">
        <span>
          Status: <strong safe>{c.status}</strong>
        </span>
        <span>
          Priority: <strong safe>{`${c.severity} (${c.score.toFixed(1)})`}</strong>
        </span>
        <span>
          Open: <strong>{c.open_reports}</strong> / {c.total_reports}
        </span>
        <span>
          Reporters: <strong>{c.reporters}</strong>
        </span>
        <span>
          EAC: <strong>{c.eac.violations}</strong> violations, <strong>{c.eac.kicks}</strong> kicks
        </span>
        {(c.flags ?? []).length > 0 && <span safe>Flags: {(c.flags ?? []).join(', ')}</span>}
      </div>

      <div class="edit-player-ban-list">
        {(c.reports ?? []).map(report => (
          <div class="ban-item group">
            <div class="col-span-3">
              <span class="me-2 text-2xl font-bold" safe>
                {report.reason_name}
              </span>
              <span class="text-sm">
                by <PlayerLink steamId={report.reporter} name={report.reporter_name} />{' '}
                <span safe>{`(weight ${report.reporter_weight.toFixed(1)})`}</span>
                {!report.open && <span class="italic"> (closed)</span>}
              </span>
            </div>
            <div class="row-span-2"></div>
            <span class="text-base">
              At: <strong safe>{format(report.at, 'MMMM dd, yyyy, HH:mm')}</strong>
            </span>
            <span class="text-base">
              {report.match_id && (
                <>
                  Match:{' '}
                  <a href={`/games/${report.match_id}`} class="underline" safe>
                    {report.map ?? report.match_id}
                  </a>
                </>
              )}
            </span>
            <span class="text-base" safe>
              {[...(report.details ?? []), report.comment ?? ''].filter(Boolean).join(' · ')}
            </span>
          </div>
        ))}
      </div>

      {(c.resolutions ?? []).length > 0 && (
        <>
          <h4 class="text-abru-light-75 mt-4 text-xl font-bold">Resolutions</h4>
          <ul class="text-abru-light-75 list-disc pl-6">
            {(c.resolutions ?? []).map(r => (
              <li safe>
                {`${format(r.at, 'dd.MM.yyyy HH:mm')} · ${r.outcome} by ${r.by} · ${r.reports} reports${r.note ? ` · ${r.note}` : ''}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

async function EditPlayer(props: {
  steamId: SteamId64
  name: string
  children: Children
  activePage: keyof typeof editPlayerPages
  action?: Children
}) {
  return (
    <Layout
      title={makeTitle(`Edit ${props.name}`)}
      embedStyle={resolve(import.meta.dirname, 'edit-player.page.css')}
    >
      <NavigationBar />
      <Page>
        <AdminPanel>
          <AdminPanelSidebar>
            <AdminPanelSection>
              Edit player: <span safe>{props.name}</span>
            </AdminPanelSection>
            <AdminPanelLink href={`/players/${props.steamId}`}>
              <IconArrowBackUp />
              Back
            </AdminPanelLink>
            <AdminPanelLink
              href={`/players/${props.steamId}/edit/bans`}
              active={props.activePage === '/bans'}
            >
              <IconBan />
              Bans
            </AdminPanelLink>
            <AdminPanelLink
              href={`/players/${props.steamId}/edit/reports`}
              active={props.activePage === '/reports'}
            >
              <IconAlertSquareRounded />
              Reports
            </AdminPanelLink>
          </AdminPanelSidebar>
          <AdminPanelBody>
            <div class="admin-panel-header">
              <AdminPanelHeader>{editPlayerPages[props.activePage]}</AdminPanelHeader>
              {props.action ?? <></>}
            </div>
            {props.children}
          </AdminPanelBody>
        </AdminPanel>
      </Page>
      <Footer />
    </Layout>
  )
}

function BanDetails(props: {
  steamId: SteamId64
  id: string
  title: string
  by: string
  start: Date
  end: Date | undefined
  revoke: 'clear' | 'steam_unban' | undefined
}) {
  const actor = props.by.startsWith('admin:') ? props.by.slice('admin:'.length) : undefined
  return (
    <div class="ban-item group" id={`player-ban-${props.id}`}>
      <form class="contents">
        <div class="col-span-3">
          <span class="me-2 text-2xl font-bold" safe>
            {props.title}
          </span>
          <span class="text-sm">
            by {actor ? <PlayerLink steamId={actor} /> : <span safe>{props.by}</span>}
          </span>
        </div>

        <div class="row-span-2 flex items-center">
          {props.revoke ? (
            <button
              class="button"
              data-variant="darker"
              hx-put={`/players/${props.steamId}/edit/bans/${props.revoke}`}
              hx-prompt="Why is this ban lifted?"
              hx-trigger="click"
              hx-target="body"
            >
              <IconX />
              <span class="sr-only">Revoke ban</span>
            </button>
          ) : (
            <></>
          )}
        </div>

        <span class="text-base">
          Starts: <strong safe>{format(props.start, 'MMMM dd, yyyy, HH:mm')}</strong>
        </span>

        <span class="text-base">
          Ends:{' '}
          <strong safe>
            {props.end ? format(props.end, 'MMMM dd, yyyy, HH:mm') : 'when lifted'}
          </strong>
        </span>
      </form>
    </div>
  )
}
