import { format } from 'date-fns'
import { gc } from '../../../gc'
import { IconBan, IconCheck, IconChevronRight, IconEdit } from '../../../html/components/icons'
import type { SteamId64 } from '../../../shared/types/steam-id-64'

export async function AdminToolbox(props: { steamId: SteamId64 }) {
  const [record, reportCase] = await Promise.all([
    gc.antiCheatRecord(props.steamId),
    gc.reportCase(props.steamId),
  ])

  return (
    <details
      id="player-admin-toolbox"
      class="admin-toolbox-details"
      data-details-persist="admin-toolbox"
    >
      <summary class="admin-toolbox-summary">
        <IconChevronRight size={14} class="admin-toolbox-chevron" />
        <span>Admin toolbox</span>
      </summary>
      <script>
        {
          `try{if(localStorage.getItem('details-persist-admin-toolbox')==='open'){document.currentScript.closest('details').setAttribute('open','');}}catch(e){}` as 'safe'
        }
      </script>

      <div class="player-admin-toolbox">
        <div class="admin-toolbox-header">
          <BanStatus sanction={record.sanction} steamId={props.steamId} />
          {reportCase && (
            <a
              href={`/players/${props.steamId}/edit/reports`}
              class="text-abru-light-50 hover:text-abru-light-75 shrink-0 text-sm"
            >
              {`${reportCase.open_reports} open / ${reportCase.total_reports} reports`}
            </a>
          )}
          <a
            href={`/admin/logs?player=${props.steamId}`}
            class="text-abru-light-50 hover:text-abru-light-75 shrink-0 text-sm"
          >
            Logs
          </a>
          <a
            href={`/players/${props.steamId}/edit`}
            class="button shrink-0"
            data-variant="accent"
            title="Edit player"
          >
            <IconEdit />
            <span>Edit player</span>
          </a>
        </div>
        {record.product_user_id && (
          <div class="text-abru-light-50 text-sm" safe>
            {`EOS product user ID: ${record.product_user_id}`}
            {record.verified_at
              ? ` · last protected session ${format(record.verified_at, 'dd.MM.yyyy HH:mm')}`
              : ''}
          </div>
        )}
      </div>
    </details>
  )
}

function BanStatus(props: {
  sanction: { until?: Date | undefined; reason: string } | undefined
  steamId: SteamId64
}) {
  const { sanction } = props
  if (sanction && (!sanction.until || sanction.until > new Date())) {
    return (
      <div class="flex min-w-0 flex-1 items-center gap-3 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-300">
        <IconBan size={16} class="shrink-0" />
        <div class="flex min-w-0 flex-col">
          <span>
            Banned{' '}
            {sanction.until ? (
              <>
                until <strong safe>{format(sanction.until, 'MMM dd, yyyy, HH:mm')}</strong>
              </>
            ) : (
              'until lifted'
            )}
          </span>
          <span class="truncate text-red-300/70" safe>
            {sanction.reason}
          </span>
        </div>
        <a
          href={`/players/${props.steamId}/edit/bans`}
          class="ml-auto shrink-0 text-xs text-red-300 underline hover:text-red-200"
        >
          Manage bans
        </a>
      </div>
    )
  }

  return (
    <div class="bg-abru-light-5 text-abru-light-50 flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm">
      <IconCheck size={16} class="shrink-0" />
      <span>No active ban</span>
      <a
        href={`/players/${props.steamId}/edit/bans`}
        class="text-abru-light-50 hover:text-abru-light-75 ml-auto text-xs underline"
      >
        Manage bans
      </a>
    </div>
  )
}
