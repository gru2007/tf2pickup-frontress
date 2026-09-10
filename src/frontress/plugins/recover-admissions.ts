import { secondsToMilliseconds } from 'date-fns'
import fp from 'fastify-plugin'
import { collections } from '../../database/collections'
import { FrontressAdmissionState, GameKind, GameState } from '../../database/models/game.model'
import { logger } from '../../logger'
import { applyAdmission } from '../apply-admission'

const retryInterval = secondsToMilliseconds(20)

export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async app => {
    let running = false
    const recover = async () => {
      if (running) return
      running = true
      try {
        const games = await collections.games
          .find({
            kind: GameKind.frontress,
            state: { $in: [GameState.launching, GameState.started] },
            'frontress.admissions.state': FrontressAdmissionState.pending,
          })
          .toArray()
        await Promise.allSettled(
          games.flatMap(game =>
            (game.frontress?.admissions ?? [])
              .filter(admission => admission.state === FrontressAdmissionState.pending)
              .map(async admission => {
                try {
                  await applyAdmission(game.number, admission.id)
                } catch (error: unknown) {
                  logger.warn(
                    { error, game: game.number, admission: admission.id },
                    'Frontress admission is still pending',
                  )
                }
              }),
          ),
        )
      } finally {
        running = false
      }
    }
    app.addHook('onListen', recover)
    const timer = setInterval(recover, retryInterval)
    timer.unref()
    app.addHook('onClose', () => {
      clearInterval(timer)
    })
  },
  { name: 'recover Frontress admissions' },
)
