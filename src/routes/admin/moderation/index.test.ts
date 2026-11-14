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
import chatRoutes from '../chat'

vi.mock('../../../gc', () => ({
  gc: {
    moderateClan: vi.fn().mockResolvedValue({ ok: 'ok' }),
    moderatePlayer: vi.fn().mockResolvedValue({ ok: 'ok' }),
    deleteChatMessage: vi.fn().mockResolvedValue({ ok: 'ok' }),
    isGcError: () => false,
  },
}))
vi.mock('../../../admin/moderation/views/html/moderation.page', () => ({ ModerationPage: vi.fn() }))
vi.mock('../../../admin/chat/views/html/chat.page', () => ({ ChatPage: vi.fn() }))

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
  await app.register(chatRoutes, { prefix: '/admin/chat' })
})
afterEach(async () => {
  await app.close()
})

describe('moderation routes', () => {
  it('requires an authenticated administrator for every mutation', async () => {
    for (const { url, payload } of [
      {
        url: '/admin/moderation/players',
        payload: { steamId: target, action: 'mute', reason: 'abuse' },
      },
      {
        url: '/admin/moderation/clans/abcdefgh',
        payload: { action: 'ban', reason: 'symbols', confirm: 'yes' },
      },
      { url: '/admin/moderation/clans/abcdefgh/tag', payload: { tag: 'NEW', reason: 'symbols' } },
      { url: '/admin/chat/players', payload: { steamId: target, action: 'mute', reason: 'abuse' } },
      { url: '/admin/chat/messages/1', payload: { reason: 'abuse', epoch: '123' } },
    ]) {
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
    expect(vi.mocked(gc.deleteChatMessage).mock.calls.length).toBe(0)
  })

  it('edits tags and deletes chat using the signed-in moderator', async () => {
    const headers = { 'x-test-role': 'admin' }
    const tag = await app.inject({
      method: 'POST',
      url: '/admin/moderation/clans/abcdefgh/tag',
      headers,
      payload: { tag: 'NEW', reason: 'symbols', actor: target },
    })
    expect(tag.statusCode).toBe(302)
    expect(gc.moderateClan).toHaveBeenCalledWith('abcdefgh', actor, {
      action: 'set_tag',
      tag: 'NEW',
      reason: 'symbols',
    })
    const deleted = await app.inject({
      method: 'POST',
      url: '/admin/chat/messages/1',
      headers,
      payload: { reason: 'abuse', epoch: '123', actor: target },
    })
    expect(deleted.statusCode).toBe(302)
    expect(gc.deleteChatMessage).toHaveBeenCalledWith(1, actor, 'abuse', '123')
    const read = await app.inject({
      method: 'GET',
      url: '/admin/chat',
      headers: { 'x-test-role': 'player' },
    })
    expect(read.statusCode).toBe(403)
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
