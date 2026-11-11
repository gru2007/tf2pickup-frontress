import type { GcMatch } from '../../../gc/schemas'
import { IconLogs, IconX } from '../../../html/components/icons'

// The game page's admin controls. The coordinator runs the match; the only
// thing to do from here is to end one that is stuck.
export function AdminToolbox(props: { game: GcMatch }) {
  return (
    <div class="game-admin-toolbox">
      <div class="controls">
        <AdminToolbox.gameControlButtons {...props} />
      </div>
    </div>
  )
}

AdminToolbox.gameControlButtons = (props: { game: GcMatch }) => {
  return (
    <>
      <a href={`/admin/logs?match=${props.game.match_id}`} class="button">
        <IconLogs />
        Logs
      </a>
      <button
        class="button"
        disabled={props.game.state === 'ended'}
        id={`game-${props.game.match_id}-force-end-game-button`}
        hx-trigger="click"
        hx-put={`/games/${props.game.match_id}/force-end`}
        hx-prompt="Why are you ending this game? The coordinator records the reason."
        hx-target="closest .controls"
      >
        <IconX />
        Force-end
      </button>
    </>
  )
}
