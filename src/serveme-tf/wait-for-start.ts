import type { ReservationId } from '@tf2pickup-org/serveme-tf-client'
import { get } from './cache'
import { logger } from '../logger'
import { secondsToMilliseconds } from 'date-fns'
import { environment } from '../environment'

export async function waitForStart(reservationId: ReservationId) {
  const r = await get(reservationId)
  await r.waitForStarted(secondsToMilliseconds(environment.SERVEME_TF_SERVER_BOOT_TIMEOUT_SECONDS))
  logger.debug({ reservationId: r.id }, `gameserver started`)
  return r
}
