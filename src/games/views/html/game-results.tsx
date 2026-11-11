import type { GcMatch } from '../../../gc/schemas'
import { GameClassIcon } from '../../../html/components/game-class-icon'
import { classesPlayed } from '../../classes-played'
import { gameTeamBlu } from '../../game-teams'
import { firstNonEmpty } from '../../../utils/first-non-empty'

// Where the pickup game page listed its events: the scoreboard the server
// reported at the end of the match.
export function GameResults(props: { game: GcMatch }) {
  const players = props.game.result?.players ?? []
  if (players.length === 0) {
    return <div class="game-events"></div>
  }
  const names = new Map((props.game.members ?? []).map(m => [m.steam_id, m.name]))
  const sorted = players.toSorted((a, b) => a.team - b.team || b.score - a.score)
  return (
    <div class="game-events">
      <div class="game-event-list">
        <div class="game-event overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr>
                <th class="px-2 py-1">Player</th>
                <th class="px-2 py-1">Classes</th>
                <th class="px-2 py-1 text-right">Score</th>
                <th class="px-2 py-1 text-right">K</th>
                <th class="px-2 py-1 text-right">D</th>
                <th class="px-2 py-1 text-right">Damage</th>
                <th class="px-2 py-1 text-right">Healing</th>
                <th class="px-2 py-1 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr class={p.team === gameTeamBlu ? 'text-team-blu' : 'text-team-red'}>
                  <td class="px-2 py-1">
                    <a
                      href={`/players/${p.steam_id}`}
                      class="text-abru-light-85 hover:underline"
                      safe
                    >
                      {firstNonEmpty(names.get(p.steam_id), p.steam_id)}
                    </a>
                  </td>
                  <td class="px-2 py-1">
                    {classesPlayed(p.classes_played).map(c => (
                      <GameClassIcon gameClass={c} size={20} />
                    ))}
                  </td>
                  <td class="text-abru-light-75 px-2 py-1 text-right tabular-nums">{p.score}</td>
                  <td class="text-abru-light-75 px-2 py-1 text-right tabular-nums">{p.kills}</td>
                  <td class="text-abru-light-75 px-2 py-1 text-right tabular-nums">{p.deaths}</td>
                  <td class="text-abru-light-75 px-2 py-1 text-right tabular-nums">{p.damage}</td>
                  <td class="text-abru-light-75 px-2 py-1 text-right tabular-nums">{p.healing}</td>
                  <td class="text-abru-light-75 px-2 py-1 text-right tabular-nums">
                    {p.excluded_from_progression ? '—' : `+${p.xp_change ?? 0}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
