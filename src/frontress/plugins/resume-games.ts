import fp from 'fastify-plugin'
import { collections } from '../../database/collections'
import { GameKind, GameState } from '../../database/models/game.model'
import { launchGame } from '../launch-game'

export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async app => {
    app.addHook('onListen', async () => {
      const games = await collections.games
        .find(
          {
            kind: GameKind.frontress,
            state: { $in: [GameState.created, GameState.configuring] },
          },
          { projection: { number: 1 } },
        )
        .toArray()
      for (const game of games) launchGame(game.number)
    })
  },
  { name: 'resume Frontress games' },
)
