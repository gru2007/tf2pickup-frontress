import { format, formatDuration, intervalToDuration } from 'date-fns'
import type { GcMatch } from '../../../gc/schemas'
import { MapThumbnail } from '../../../html/components/map-thumbnail'
import { GameStateIndicator } from './game-state-indicator'

export function GameSummary(props: { game: GcMatch }) {
  const { game } = props
  const duration = game.result?.duration
  return (
    <div
      id={`game-${game.match_id}-summary`}
      class="text-abru-light-75 flex flex-col overflow-hidden rounded-lg xl:mr-4"
      style="grid-area: gameSummary"
    >
      <div class="game-summary-caption relative flex min-h-[200px] flex-1 flex-col justify-end px-[10px]">
        <div class="absolute top-0 right-0 bottom-0 left-0 -z-10">
          <MapThumbnail map={game.map} />
        </div>

        <div class="game-floating-label text-abru-light-75 top-[10px] left-[10px]">
          <span safe>{game.group_name}</span>
        </div>

        <GameStateIndicator game={game} />

        <div class="game-info">
          <span class="game-info-label">map</span>
          <span class="game-info-value" safe>
            {game.map}
          </span>
        </div>
      </div>

      <div class="bg-abru-dark-29 flex flex-col gap-[8px] p-[10px]">
        <div class="game-info">
          <span class="game-info-label">launched</span>
          <span class="game-info-value" safe>
            {format(game.started_at ?? game.formed_at, 'dd.MM.yyyy HH:mm')}
          </span>
        </div>

        {duration ? (
          <div class="game-info">
            <span class="game-info-label">duration</span>
            <span class="game-info-value" safe>
              {formatDuration(intervalToDuration({ start: 0, end: duration * 1000 }))}
            </span>
          </div>
        ) : (
          <></>
        )}

        {game.region && (
          <div class="game-info">
            <span class="game-info-label">region</span>
            <span class="game-info-value uppercase" safe>
              {game.region}
            </span>
          </div>
        )}

        {game.campaign && (
          <div class="game-info">
            <span class="game-info-label">war campaign</span>
            <span class="game-info-value" safe>
              {game.campaign}
            </span>
          </div>
        )}

        {game.state === 'ended' && game.reason && (
          <div class="game-info">
            <span class="game-info-label">ended</span>
            <span class="game-info-value" safe>
              {game.reason}
            </span>
          </div>
        )}

        <div class="game-info">
          <span class="game-info-label">match id</span>
          <span class="game-info-value tabular-nums" safe>
            {game.match_id}
          </span>
        </div>
      </div>
    </div>
  )
}
