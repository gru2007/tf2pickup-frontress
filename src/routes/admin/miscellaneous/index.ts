import { z } from 'zod'
import { PlayerRole } from '../../../auth/player-role'
import { MiscellaneousPage } from '../../../admin/miscellaneous/views/html/miscellaneous.page'
import { routes } from '../../../utils/routes'
import { gc } from '../../../gc'
import { saveSettings } from '../../../admin/save-settings'
import { formValues } from '../../../admin/form-values'

const form = z.record(z.string(), z.unknown())
const back = '/admin/miscellaneous'
const superUser = { config: { authorize: [PlayerRole.superUser] }, schema: { body: form } }

// "a | b | c" lines, each split into trimmed fields.
function rows(value: unknown) {
  return formValues
    .raw(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.split('|').map(f => f.trim()))
}

// eslint-disable-next-line @typescript-eslint/require-await
export default routes(async app => {
  app
    .get('/', { config: { authorize: [PlayerRole.admin] } }, async (_request, reply) => {
      await reply.status(200).html(MiscellaneousPage())
    })
    .post('/general', superUser, async (request, reply) =>
      saveSettings(request, reply, {
        revision: formValues.number(request.body['revision']),
        sections: { name: formValues.text(request.body['name']) },
        note: 'name',
        back,
      }),
    )
    .post('/regions', superUser, async (request, reply) => {
      const { settings } = await gc.settings()
      const b = request.body
      const regions = rows(b['regions']).map(([id = '', name = '', pops = '']) => ({
        id,
        name: name || id,
        pops: pops
          .split(/[\s,]+/)
          .map(p => p.toLowerCase())
          .filter(Boolean),
      }))
      return saveSettings(request, reply, {
        revision: formValues.number(b['revision']),
        sections: {
          regions,
          region_wait_secs: formValues.number(b['region_wait_secs']),
          server_ping: {
            ...settings.sections.server_ping,
            max_ms: formValues.number(b['max_ms']),
            answer_secs: formValues.number(b['answer_secs']),
          },
        },
        note: 'regions and ping',
        back,
      })
    })
    .post('/anticheat', superUser, async (request, reply) => {
      const { settings } = await gc.settings()
      const b = request.body
      const ac = settings.sections.anticheat
      const mode = formValues.text(b['steam_game_bans'])
      return saveSettings(request, reply, {
        revision: formValues.number(b['revision']),
        sections: {
          anticheat: {
            ...ac,
            require_protected_servers: formValues.checked(b['require_protected_servers']),
            temp_ban_hours: formValues.number(b['temp_ban_hours']),
            steam_game_bans: {
              ...ac.steam_game_bans,
              mode: ['off', 'manual', 'auto'].includes(mode) ? mode : 'off',
              immediate: formValues.checked(b['immediate']),
              forward_player_reports: formValues.checked(b['forward_player_reports']),
            },
          },
        },
        note: 'anti-cheat',
        back,
      })
    })
    .post('/timing', superUser, async (request, reply) => {
      const { settings } = await gc.settings()
      const b = request.body
      const keys = [
        'tick_millis',
        'session_ttl_secs',
        'poll_secs',
        'server_boot_secs',
        'server_lost_secs',
        'no_show_secs',
        'max_match_secs',
        'offline_grace_secs',
      ] as const
      const timing: Record<string, unknown> = { ...settings.sections.timing }
      for (const key of keys) {
        timing[key] = Math.max(0, formValues.number(b[key]))
      }
      return saveSettings(request, reply, {
        revision: formValues.number(b['revision']),
        sections: { timing },
        note: 'deadlines',
        back,
      })
    })
    .post('/webhooks', superUser, async (request, reply) => {
      const webhooks = rows(request.body['webhooks']).map(
        ([name = '', url = '', secret = '', events = '']) => ({
          name,
          url,
          secret,
          events: events
            .split(/[\s,]+/)
            .map(e => e.trim())
            .filter(Boolean),
        }),
      )
      return saveSettings(request, reply, {
        revision: formValues.number(request.body['revision']),
        sections: { webhooks },
        note: 'webhooks',
        back,
      })
    })
})
