import type { z } from 'zod'
import { secondsToMilliseconds } from 'date-fns'
import { environment } from '../environment'
import { errors } from '../errors'
import { logger } from '../logger'
import type { SteamId64 } from '../shared/types/steam-id-64'
import { gcSchemas } from './schemas'

// The Frontress game coordinator is the only place this site reads or writes
// game data: players, matches, bans, reports and payments all live there.

class GcError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T extends z.ZodType>(
  schema: T,
  path: string,
  options: {
    admin?: boolean
    method?: 'GET' | 'POST' | 'PUT'
    body?: unknown
    actor?: SteamId64
  } = {},
): Promise<z.infer<T>> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (options.admin) {
    if (!environment.GC_ADMIN_KEY) {
      throw errors.serviceUnavailable('The coordinator admin key is not configured')
    }
    headers['authorization'] = `Bearer ${environment.GC_ADMIN_KEY}`
  }
  if (options.actor) {
    headers['x-frontress-actor'] = options.actor
  }
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(new URL(path, environment.GC_URL), {
      method: options.method ?? 'GET',
      headers,
      ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(
        secondsToMilliseconds(options.method && options.method !== 'GET' ? 30 : 10),
      ),
    })
  } catch (error) {
    logger.warn({ error, path }, 'game coordinator unreachable')
    throw errors.serviceUnavailable('The game coordinator is unavailable, try again in a minute')
  }

  const body: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `game coordinator answered ${response.status}`
    throw new GcError(response.status, message)
  }
  return schema.parse(body)
}

async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof GcError && error.statusCode === 404) {
      return null
    }
    throw error
  }
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

export const gc = {
  isGcError: (error: unknown): error is GcError => error instanceof GcError,
  adminEnabled: () => Boolean(environment.GC_ADMIN_KEY),

  // public
  status: () => request(gcSchemas.status, '/v1/status'),
  matches: (params: {
    offset?: number | undefined
    limit?: number | undefined
    steamId?: SteamId64 | undefined
    state?: string | undefined
  }) =>
    request(
      gcSchemas.matchPage,
      `/v1/matches${query({ offset: params.offset, limit: params.limit, steam_id: params.steamId, state: params.state })}`,
    ),
  match: (id: string) => orNull(request(gcSchemas.match, `/v1/matches/${encodeURIComponent(id)}`)),
  player: (steamId: SteamId64) => request(gcSchemas.player, `/v1/player/${steamId}`),
  players: (params: {
    q?: string | undefined
    sort?: string | undefined
    offset?: number | undefined
    limit?: number | undefined
  }) => request(gcSchemas.playerList, `/v1/players${query(params)}`),
  quests: (steamId: SteamId64) => request(gcSchemas.quests, `/v1/player/${steamId}/quests`),

  // admin
  live: () => request(gcSchemas.live, '/admin/v1/live', { admin: true }),
  endMatch: (matchId: string, actor: SteamId64, reason: string) =>
    request(gcSchemas.ok, `/admin/v1/matches/${encodeURIComponent(matchId)}/end`, {
      admin: true,
      method: 'POST',
      actor,
      body: { reason },
    }),
  sanctions: () => request(gcSchemas.sanctions, '/admin/v1/anticheat', { admin: true }),
  antiCheatRecord: (steamId: SteamId64) =>
    request(gcSchemas.antiCheatRecord, `/admin/v1/anticheat/${steamId}`, { admin: true }),
  antiCheatAction: (
    steamId: SteamId64,
    actor: SteamId64,
    body:
      | { action: 'ban'; hours: number; reason: string; steam: boolean }
      | { action: 'clear' | 'steam_ban' | 'steam_unban'; reason: string },
  ) =>
    request(gcSchemas.ok, `/admin/v1/anticheat/${steamId}`, {
      admin: true,
      method: 'POST',
      actor,
      body,
    }),
  reportCases: (status: 'open' | 'closed' | 'all', limit = 100) =>
    request(gcSchemas.reportCases, `/admin/v1/reports${query({ status, limit })}`, { admin: true }),
  reportCase: (steamId: SteamId64) =>
    orNull(request(gcSchemas.reportCaseDetail, `/admin/v1/reports/${steamId}`, { admin: true })),
  reportAction: (
    steamId: SteamId64,
    actor: SteamId64,
    body:
      | { action: 'ban'; hours: number; reason: string; steam: boolean }
      | { action: 'dismiss'; reason: string },
  ) =>
    request(gcSchemas.ok, `/admin/v1/reports/${steamId}`, {
      admin: true,
      method: 'POST',
      actor,
      body,
    }),
  settings: () => request(gcSchemas.settings, '/admin/v1/settings', { admin: true }),
  saveSettings: (
    actor: SteamId64,
    revision: number,
    sections: Record<string, unknown>,
    note?: string,
  ) =>
    request(gcSchemas.settings.pick({ settings: true }), '/admin/v1/settings', {
      admin: true,
      method: 'PUT',
      actor,
      body: { revision, sections, note: note ?? '' },
    }),
  settingsHistory: (limit = 50) =>
    request(gcSchemas.settingsHistory, `/admin/v1/settings/history?limit=${limit}`, {
      admin: true,
    }),
  serverKeys: () => request(gcSchemas.serverKeys, '/admin/v1/server-keys', { admin: true }),
  changeServerKey: (
    actor: SteamId64,
    change: {
      action: 'create' | 'update' | 'rotate' | 'revoke'
      name: string
      community?: string
      region?: string
      anticheat_authority?: boolean
    },
  ) =>
    request(gcSchemas.serverKeyResult, '/admin/v1/server-keys', {
      admin: true,
      method: 'POST',
      actor,
      body: {
        action: change.action,
        name: change.name,
        community: change.community ?? '',
        region: change.region ?? '',
        anticheat_authority: change.anticheat_authority ?? false,
      },
    }),
  journal: (params: {
    steamId?: string | undefined
    server?: string | undefined
    match?: string | undefined
    q?: string | undefined
    level?: string | undefined
    before?: number | undefined
    limit?: number | undefined
  }) =>
    request(
      gcSchemas.journal,
      `/admin/v1/journal${query({
        steam_id: params.steamId,
        server: params.server,
        match: params.match,
        q: params.q,
        level: params.level,
        before: params.before,
        limit: params.limit,
      })}`,
      { admin: true },
    ),
  payments: () => orUnavailable(request(gcSchemas.payments, '/admin/v1/payments', { admin: true })),
  paymentOperation: (actor: SteamId64, operation: Record<string, unknown>) =>
    request(
      gcSchemas.payments.shape.operations.unwrap().unwrap().element,
      '/admin/v1/payments/operations',
      {
        admin: true,
        method: 'POST',
        actor,
        body: operation,
      },
    ),
}

// Payments are off (or fake) on the coordinator: 503, not an error page.
async function orUnavailable<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof GcError && error.statusCode === 503) {
      return null
    }
    throw error
  }
}
