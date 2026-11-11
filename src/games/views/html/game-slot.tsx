import type { z } from 'zod'
import type { gcSchemas } from '../../../gc/schemas'
import { GameClassIcon } from '../../../html/components/game-class-icon'
import type { PlayerSummary } from '../../../steam/get-player-summaries'
import { playerAvatarUrl } from '../../../shared/player-avatar-url'
import { classesPlayed } from '../../classes-played'
import { firstNonEmpty } from '../../../utils/first-non-empty'

type Member = NonNullable<z.infer<typeof gcSchemas.match>['members']>[number]
type Result = NonNullable<NonNullable<z.infer<typeof gcSchemas.match>['result']>['players']>[number]

export function GameSlot(props: {
  member: Member
  result: Result | undefined
  summary: PlayerSummary | undefined
}) {
  const name = firstNonEmpty(props.member.name, props.summary?.name) ?? props.member.steam_id
  const mainClass = classesPlayed(props.result?.classes_played)[0]
  return (
    <div
      id={`game-slot-${props.member.steam_id}`}
      aria-label={`${name}'s slot`}
      class={['slot', props.member.left ? 'left' : 'active']}
      data-player={props.member.steam_id}
    >
      {mainClass ? (
        <div class="class-icon">
          <GameClassIcon gameClass={mainClass} size={32} />
        </div>
      ) : (
        <></>
      )}
      <img
        src={playerAvatarUrl(props.summary?.avatar, 'medium')}
        width="38"
        height="38"
        alt={`${name}'s avatar`}
      />
      <a href={`/players/${props.member.steam_id}`} class="player-link">
        <span class="player-name" safe>
          {name}
        </span>
        {props.result && (
          <span class="player-match-stats tabular-nums">
            {props.result.kills}/{props.result.deaths}
          </span>
        )}
        {props.member.left && <span class="player-match-stats">left</span>}
      </a>
    </div>
  )
}
