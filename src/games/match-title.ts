import type { GcMatch } from '../gc/schemas'
import { matchKind } from './match-kind'

// The name a match goes by in lists: war battles by the sector fought over,
// other matches by their queue.
export function matchTitle(game: GcMatch): string {
  switch (matchKind(game)) {
    case 'war':
      return game.sector ? `War · ${game.sector}` : 'War battle'
    case 'ranked':
      return game.group_name || 'Ranked'
    case 'casual':
      return game.group_name || 'Casual'
  }
}
