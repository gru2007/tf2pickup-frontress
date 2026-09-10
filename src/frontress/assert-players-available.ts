import type { StrictFilter } from 'mongodb'
import { collections } from '../database/collections'
import {
  FrontressAdmissionState,
  GameState,
  type GameModel,
  type GameNumber,
} from '../database/models/game.model'
import { errors } from '../errors'
import type { SteamId64 } from '../shared/types/steam-id-64'

export async function assertPlayersAvailable(
  steamIds: SteamId64[],
  gameNumber?: GameNumber,
): Promise<void> {
  const ownedGame = await collections.games.findOne({
    ...(gameNumber !== undefined && { number: { $ne: gameNumber } }),
    state: {
      $in: [GameState.created, GameState.configuring, GameState.launching, GameState.started],
    },
    $or: [
      { 'slots.player': { $in: steamIds } },
      {
        'frontress.admissions': {
          $elemMatch: {
            state: FrontressAdmissionState.pending,
            'slots.player': { $in: steamIds },
          },
        },
      },
    ],
  } as StrictFilter<GameModel>)
  if (ownedGame) throw errors.conflict('player already belongs to another active game')

  const player = await collections.players.findOne({
    steamId: { $in: steamIds },
    ...(gameNumber === undefined
      ? { activeGame: { $exists: true } }
      : { activeGame: { $exists: true, $ne: gameNumber } }),
  })
  if (player) throw errors.conflict(`player ${player.steamId} already has an active game`)
}
