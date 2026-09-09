import { httpErrors } from '@fastify/sensible'

export const errors = {
  badRequest: httpErrors.badRequest,
  unauthorized: httpErrors.unauthorized,
  forbidden: httpErrors.forbidden,
  notFound: httpErrors.notFound,
  conflict: httpErrors.conflict,
  badGateway: httpErrors.badGateway,

  internalServerError: httpErrors.internalServerError,
} as const
