import fp from 'fastify-plugin'
import { openId } from '../open-id'
import { environment } from '../../environment'
import { logger } from '../../logger'
import type { SteamId64 } from '../../shared/types/steam-id-64'
import type { User } from '../types/user'
import { withLogLevel } from '../../utils/with-log-level'
import { getPlayerSummaries } from '../../steam/get-player-summaries'
import { rolesOf } from '../roles-of'
import { gc } from '../../gc'
import { defaultPlayerAvatar } from '../../shared/default-player-avatar'
import { firstNonEmpty } from '../../utils/first-non-empty'

declare module '@fastify/secure-session' {
  interface SessionData {
    steamId: SteamId64
    name: string
    avatar: string
  }
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    user?: User
  }
}

const getSteamLoginUrl = async (): Promise<string> =>
  new Promise((resolve, reject) => {
    openId.authenticate('https://steamcommunity.com/openid', false, (err, authUrl) => {
      if (err) {
        reject(new Error(err.message))
        return
      }

      if (!authUrl) {
        reject(new Error(`Authentication failed: authUrl is empty`))
        return
      }

      resolve(authUrl)
    })
  })

const verifySteamCallback = (url: string): Promise<SteamId64> =>
  new Promise((resolve, reject) => {
    openId.verifyAssertion(url, (err, result) => {
      if (err) {
        const error = new Error(err.message)
        // A replayed nonce just means a stale/duplicated callback request (e.g.
        // the user refreshed the return URL), not a server fault — log at debug.
        reject(err.message === 'Invalid or replayed nonce' ? withLogLevel(error, 'debug') : error)
        return
      }

      if (result?.claimedIdentifier === undefined) {
        reject(new Error(`no auth info from Steam API`))
        return
      }

      if (!result.authenticated) {
        reject(new Error(`not authenticated`))
        return
      }

      if (!/^https?:\/\/steamcommunity\.com\/openid\/id\/\d{17}$/.test(result.claimedIdentifier)) {
        reject(new Error('invalid claimedIdentifier'))
        return
      }

      resolve(result.claimedIdentifier.split('/').pop() as SteamId64)
    })
  })

// Steam sign-in. Nothing is stored on this site: the session cookie holds the
// SteamID with the name and avatar Steam (or the coordinator) gave at sign-in.
export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async app => {
    app.get('/auth/steam', async (_request, reply) => {
      const url = await getSteamLoginUrl()
      return await reply.redirect(url, 302)
    })

    app.get('/auth/steam/return', async (request, reply) => {
      const steamId = await verifySteamCallback(request.url)
      const summary = (await getPlayerSummaries([steamId])).get(steamId)!
      const name =
        firstNonEmpty(summary.name, (await gc.player(steamId).catch(() => undefined))?.name) ??
        steamId

      logger.debug({ steamId }, 'user authenticated')
      request.session.set('steamId', steamId)
      request.session.set('name', name)
      request.session.set('avatar', summary.avatar.medium)
      return await reply.redirect(`${environment.WEBSITE_URL}/players/${steamId}`, 302)
    })

    app.decorateRequest('user', undefined)

    // eslint-disable-next-line @typescript-eslint/require-await
    app.addHook('preHandler', async request => {
      const steamId = request.session.get('steamId')
      if (!steamId) {
        return
      }
      const user: User = {
        player: {
          steamId,
          name: request.session.get('name') ?? steamId,
          avatar: {
            medium: firstNonEmpty(request.session.get('avatar')) ?? defaultPlayerAvatar.medium,
          },
          roles: rolesOf(steamId),
        },
      }
      request.user = user
      request.requestContext.set('user', user)
    })
  },
  { name: 'auth/steam' },
)
