import type { FastifyRequest } from 'fastify'
import { environment } from '../environment'
import { errors } from '../errors'

export function authorize(request: FastifyRequest): void {
  if (
    !environment.FRONTRESS_GATEWAY_SECRET ||
    request.headers.authorization !== `secret ${environment.FRONTRESS_GATEWAY_SECRET}`
  ) {
    throw errors.notFound()
  }
}
