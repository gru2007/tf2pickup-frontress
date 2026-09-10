import fp from 'fastify-plugin'
import { tasks } from '../../tasks'
import { players } from '../../players'
import { configuration } from '../../configuration'
import { events } from '../../events'
import { GameEventType, type PlayerReplaced } from '../../database/models/game-event.model'
import { frontressGameClass } from '../../shared/types/game-class-name'

export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async () => {
    tasks.register('games.freePlayer', async ({ player }) => {
      await players.update(player, { $unset: { activeGame: 1 } })
      events.emit('player/activeGame:updated', { steamId: player, activeGame: undefined })
    })

    events.on('game:ended', async ({ game }) => {
      const substitutes = new Set(
        game.events
          .filter(
            (e): e is PlayerReplaced =>
              e.event === GameEventType.playerReplaced && e.replacee !== e.replacement,
          )
          .map(({ replacement }) => replacement),
      )

      const slots = new Map(
        [
          ...game.slots,
          ...(game.frontress?.admissions ?? []).flatMap(admission => admission.slots),
        ].map(slot => [slot.player, slot]),
      )
      await Promise.all(
        [...slots.values()].map(async ({ gameClass, ratingClass, player }) => {
          const queueCooldown = await configuration.get('games.join_queue_cooldown')
          const cooldownMs =
            substitutes.has(player) || ratingClass === frontressGameClass
              ? 0
              : queueCooldown[gameClass]
          await tasks.schedule('games.freePlayer', cooldownMs, { player })
        }),
      )
    })
  },
  {
    name: 'free players',
  },
)
