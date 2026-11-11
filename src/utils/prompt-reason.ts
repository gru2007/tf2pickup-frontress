import type { FastifyRequest } from 'fastify'
import { errors } from '../errors'

// The reason an admin typed into the hx-prompt dialog. The coordinator records
// it with every ban, dismissal, refund and ended match.
export function promptReason(request: FastifyRequest, minLength = 1): string {
  const header = request.headers['hx-prompt']
  const reason = (Array.isArray(header) ? header.join(' ') : (header ?? '')).trim()
  if (reason.length < minLength) {
    throw errors.badRequest(
      minLength > 1
        ? `A reason (at least ${minLength} characters) is required`
        : 'A reason is required',
    )
  }
  if (reason.length > 300) {
    throw errors.badRequest('The reason can be at most 300 characters')
  }
  return reason
}
