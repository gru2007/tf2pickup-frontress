import type { GcMatch } from '../gc/schemas'

export type MatchKind = 'casual' | 'ranked' | 'war'

// ETFMatchGroup Ladder_6v6: the ranked group.
const ladderGroup = 2

// What sort of match it was. A war battle is fought in a casual queue, so the
// match group alone cannot tell; the GC says so in `kind`. Older GCs did not,
// and then the war campaign gives a battle away.
export function matchKind(game: Pick<GcMatch, 'kind' | 'campaign' | 'match_group'>): MatchKind {
  if (game.kind === 'war' || game.kind === 'ranked' || game.kind === 'casual') {
    return game.kind
  }
  if (game.campaign) {
    return 'war'
  }
  return game.match_group === ladderGroup ? 'ranked' : 'casual'
}
