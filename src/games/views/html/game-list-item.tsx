import { format } from 'date-fns'
import type { GcMatch } from '../../../gc/schemas'
import { GameClassIcon } from '../../../html/components/game-class-icon'
import { GameLiveIndicator } from '../../../html/components/game-live-indicator'
import { MapThumbnail } from '../../../html/components/map-thumbnail'
import type { Tf2ClassName } from '../../../shared/types/tf2-class-name'
import { matchKind } from '../../match-kind'
import { matchTitle } from '../../match-title'

export function GameListItem(props: { game: GcMatch; classPlayed?: Tf2ClassName | undefined }) {
  const isRunning = props.game.state !== 'ended'
  const result = props.game.result

  let gameLabel = <div class="col-span-2"></div>
  if (result) {
    gameLabel = (
      <>
        <div class="game-list-label tabular-nums" data-team="blu">
          blu: {result.blue_score}
        </div>
        <div class="game-list-label tabular-nums" data-team="red">
          red: {result.red_score}
        </div>
      </>
    )
  } else if (props.game.state === 'ended') {
    gameLabel = (
      <div class="game-list-label" data-state="interrupted">
        no result
      </div>
    )
  } else if (props.game.state === 'setup') {
    gameLabel = (
      <div class="game-list-label" data-state="launching">
        launching
      </div>
    )
  }

  return (
    <a
      class="game-list-item"
      href={`/games/${props.game.match_id}`}
      preload="mousedown"
      data-kind={matchKind(props.game)}
    >
      <div class="live-indicator">{isRunning ? <GameLiveIndicator /> : <></>}</div>
      <span class={['game-number', isRunning && 'text-accent', 'tabular-nums']} safe>
        {matchTitle(props.game)}
      </span>
      <span class="map-name" safe>
        {props.game.map}
      </span>
      <span class="launched-at" safe>
        {format(props.game.started_at ?? props.game.formed_at, 'dd.MM.yyyy HH:mm')}
      </span>

      <div class="game-class-icon">
        {props.classPlayed && <GameClassIcon gameClass={props.classPlayed} size={32} />}
      </div>

      {gameLabel}

      <div class="absolute top-0 right-0 bottom-0 left-0 -z-10 overflow-hidden rounded-lg max-sm:left-1/3 xl:left-1/3">
        <MapThumbnail map={props.game.map} />
      </div>
    </a>
  )
}
