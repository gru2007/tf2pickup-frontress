import type { GcMatch } from '../../../gc/schemas'
import { GameLiveIndicator } from '../../../html/components/game-live-indicator'
import { IconX } from '../../../html/components/icons'

export function GameStateIndicator(props: { game: GcMatch }) {
  let indicator = <></>
  if (props.game.state !== 'ended') {
    indicator = (
      <>
        <GameLiveIndicator />
        <span class="uppercase">{props.game.state === 'setup' ? 'launching' : 'live'}</span>
      </>
    )
  } else if (!props.game.result) {
    indicator = (
      <>
        <IconX size={18} />
        <span class="text-sm leading-none font-bold">no result</span>
      </>
    )
  }

  return (
    <div
      id={`game-${props.game.match_id}-state`}
      class="game-floating-label text-accent-600 top-[10px] right-[10px]"
      aria-label="Game status"
    >
      {indicator}
    </div>
  )
}
