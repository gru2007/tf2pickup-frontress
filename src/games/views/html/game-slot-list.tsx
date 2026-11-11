import type { GcMatch } from '../../../gc/schemas'
import type { PlayerSummary } from '../../../steam/get-player-summaries'
import type { SteamId64 } from '../../../shared/types/steam-id-64'
import { GameSlot } from './game-slot'

export function GameSlotList(props: { game: GcMatch; summaries: Map<SteamId64, PlayerSummary> }) {
  const members = props.game.members ?? []
  const result = props.game.result
  const team = (name: 'blu' | 'red') => (
    <div
      class={`slot-list config-frontress team-${name}`}
      id={`game-${props.game.match_id}-slots-${name}`}
    >
      {members
        .filter(member => member.team === name)
        .map(member => (
          <GameSlot
            member={member}
            result={result?.players?.find(p => p.steam_id === member.steam_id)}
            summary={props.summaries.get(member.steam_id as SteamId64)}
          />
        ))}
    </div>
  )

  return (
    <>
      <div class="score-header team-blu">
        <span class="uppercase">blu</span>
        <span aria-label="blu team score" class="tabular-nums" style="grid-area: score">
          {result?.blue_score ?? ''}
        </span>
      </div>

      {team('blu')}

      <div class="game-class-icons"></div>

      <div class="score-header team-red">
        <span class="uppercase">red</span>
        <span aria-label="red team score" class="tabular-nums" style="grid-area: score">
          {result?.red_score ?? ''}
        </span>
      </div>

      {team('red')}
    </>
  )
}
