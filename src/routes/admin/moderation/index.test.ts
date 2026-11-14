import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import sensible from '@fastify/sensible'
import { validatorCompiler } from 'fastify-type-provider-zod'
import authorize from '../../../auth/plugins/authorize'
import { PlayerRole } from '../../../auth/player-role'
import { steamId64 } from '../../../shared/schemas/steam-id-64'
import { gc } from '../../../gc'
import moderationRoutes from './index'

vi.mock('../../../gc', () => ({
  gc: {
    moderateClan: vi.fn().mockResolvedValue({ ok: 'ok' }),
    moderatePlayer: vi.fn().mockResolvedValue({ ok: 'ok' }),
    isGcError: () => false,
  },
}))
vi.mock('../../../admin/moderation/views/html/moderation.page', () => ({ ModerationPage: vi.fn() }))

const actor = steamId64.parse('76561197960265729')
const target = steamId64.parse('76561197960265730')
let app: FastifyInstance

beforeEach(async () => {
  vi.clearAllMocks()
  app = Fastify()
  app.setValidatorCompiler(validatorCompiler)
  app.decorateRequest('user', undefined)
  app.decorateRequest(
    'flash',
    vi.fn(() => 0),
  )
  app.addHook('onRequest', async request => {
    if (request.headers['x-test-role']) {
      request.user = {
        player: {
          steamId: actor,
          name: 'Moderator',
          avatar: { medium: '' },
          roles: request.headers['x-test-role'] === 'admin' ? [PlayerRole.admin] : [],
        },
      }
    }
  })
  await app.register(sensible)
  await app.register(
    fp(
      async () => {
        // The onRequest hook above provides the test identity for this dependency.
      },
      { name: 'auth/steam' },
    ),
  )
  await app.register(authorize)
  await app.register(moderationRoutes, { prefix: '/admin/moderation' })
})
afterEach(async () => {
  await app.close()
})

describe('moderation routes', () => {
  it('requires an authenticated administrator for every mutation', async () => {
    for (const url of ['/admin/moderation/players', '/admin/moderation/clans/abcdefgh']) {
      const payload = url.endsWith('/players')
        ? { steamId: target, action: 'mute', reason: 'abuse' }
        : { action: 'ban', reason: 'symbols', confirm: 'yes' }
      for (const [headers, status] of [
        [{}, 401],
        [{ 'x-test-role': 'player' }, 403],
      ] as const) {
        const response = await app.inject({ method: 'POST', url, headers, payload })
        expect(response.statusCode).toBe(status)
      }
    }
    expect(vi.mocked(gc.moderateClan).mock.calls.length).toBe(0)
    expect(vi.mocked(gc.moderatePlayer).mock.calls.length).toBe(0)
  })

  it('sends the session actor and only the GC player action fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/moderation/players',
      headers: { 'x-test-role': 'admin' },
      payload: { steamId: target, action: 'restrict_creation', reason: 'symbols', actor: target },
    })
    expect(response.statusCode).toBe(302)
    expect(gc.moderatePlayer).toHaveBeenCalledWith(target, actor, {
      action: 'restrict_creation',
      reason: 'symbols',
    })
  })

  it('requires explicit deletion confirmation and preserves the member checkbox', async () => {
    const url = '/admin/moderation/clans/abcdefgh'
    const headers = { 'x-test-role': 'admin' }
    const payload = { action: 'ban', reason: 'symbols', restrict_members: 'on' }
    const rejected = await app.inject({ method: 'POST', url, headers, payload })
    expect(rejected.statusCode).toBe(400)
    expect(vi.mocked(gc.moderateClan).mock.calls.length).toBe(0)
    const response = await app.inject({
      method: 'POST',
      url,
      headers,
      payload: { ...payload, confirm: 'yes' },
    })
    expect(response.statusCode).toBe(302)
    expect(gc.moderateClan).toHaveBeenCalledWith('abcdefgh', actor, {
      action: 'ban',
      reason: 'symbols',
      restrict_members: true,
    })
  })
})
