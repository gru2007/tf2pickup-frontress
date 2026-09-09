import { collections } from '../database/collections'
import { GameKind, GameState } from '../database/models/game.model'

export async function getOrphanedGames() {
  return await collections.games
    .find({
      state: GameState.created,
      gameServer: { $exists: false },
      kind: { $ne: GameKind.frontress },
    })
    .toArray()
}
