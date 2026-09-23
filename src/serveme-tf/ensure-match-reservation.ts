import { randomBytes } from 'node:crypto'
import { add } from 'date-fns'
import { Reservation, type Client } from '@tf2pickup-org/serveme-tf-client'
import type { GameModel } from '../database/models/game.model'
import { pickServer } from './pick-server'

interface ReservationResponse {
  reservation: ConstructorParameters<typeof Reservation>[1] & {
    match_id?: string
    ended?: boolean
  }
}

interface ReservationsResponse {
  reservations: ReservationResponse['reservation'][]
}

export async function ensureMatchReservation(
  client: Client,
  game: GameModel,
  name?: string,
): Promise<Reservation> {
  const matchId = game.frontress!.externalMatchId
  const listed = await client.httpClient.get<ReservationsResponse>(
    `/reservations?match_id=${encodeURIComponent(matchId)}&limit=1`,
  )
  const existing = listed.reservations.find(
    reservation => reservation.match_id === matchId && !reservation.ended,
  )
  if (existing) return new Reservation(client, existing)

  const { servers } = await client.findOptions()
  const serverId = await pickServer(servers, name)
  const startsAt = new Date()
  const password = randomBytes(16).toString('hex')
  const rcon = randomBytes(16).toString('hex')
  const matchMode =
    game.frontress!.matchMode === 'ranked'
      ? 'ranked'
      : game.frontress!.matchMode === 'frontline'
        ? 'casual'
        : game.frontress!.matchEmulation === 2
          ? 'ranked'
          : 'casual'
  const created = await client.httpClient.post<ReservationResponse, { reservation: object }>(
    '/reservations',
    {
      reservation: {
        server_id: serverId,
        starts_at: startsAt.toISOString(),
        ends_at: add(startsAt, { hours: 3 }).toISOString(),
        password,
        rcon,
        // Both off: the Frontress fork of serveme ships no SourceMod and no
        // demos.tf, so asking for them only made its start_reservation job
        // try to scp sourcemod.vdf into a directory the game server image
        // does not have.
        enable_plugins: false,
        enable_demos_tf: false,
        first_map: game.map,
        match_id: matchId,
        match_mode: matchMode,
        match_config: game.frontress!.serverConfig,
      },
    },
  )
  return new Reservation(client, created.reservation)
}
