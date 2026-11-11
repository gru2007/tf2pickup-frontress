import type { FastifyReply, FastifyRequest } from 'fastify'
import { gc } from '../gc'

// Saves sections of the coordinator's configuration and goes back to the
// page. What the coordinator refuses (a stale revision, an invalid value) is
// shown as an error message there.
export async function saveSettings(
  request: FastifyRequest,
  reply: FastifyReply,
  props: { revision: number; sections: Record<string, unknown>; note: string; back: string },
) {
  try {
    const result = await gc.saveSettings(
      request.user!.player.steamId,
      props.revision,
      props.sections,
      props.note,
    )
    const pending = result.settings.restart_pending
    request.flash(
      'success',
      pending.length > 0
        ? `Saved. Applies after a coordinator restart: ${pending.join(', ')}`
        : 'Saved and applied',
    )
  } catch (error) {
    if (!gc.isGcError(error)) {
      throw error
    }
    request.flash('error', error.message)
  }
  return reply.redirect(props.back)
}
