import pino from 'pino'
import { environment } from './environment'
import { serializeRequest } from './utils/serialize-request'

const stream =
  environment.NODE_ENV === 'production'
    ? pino.destination(1)
    : // pino-princess is a devDependency and absent from the production image,
      // so it must be loaded lazily and only on the dev path.
      ((await import('pino-princess')).default() as pino.DestinationStream)

export const logger = pino(
  { level: environment.LOG_LEVEL, serializers: { req: serializeRequest } },
  stream,
)
