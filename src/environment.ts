import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const steamIdList = z
  .string()
  .default('')
  .transform(value =>
    value
      .split(',')
      .map(id => id.trim())
      .filter(id => /^[0-9]{17}$/.test(id)),
  )

const environmentSchema = z.object({
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  APP_HOST: z.string().default('localhost'),
  APP_PORT: z.coerce.number().default(3000),
  TRUST_PROXY: z.string().default('loopback, uniquelocal'),

  WEBSITE_URL: z.url().default('https://mm.team-frontress.org'),
  WEBSITE_NAME: z.string().default('Team Frontress'),

  // Signs the session cookie. Keep it secret and stable: changing it signs everybody out.
  SESSION_SECRET: z.string().min(32),

  // Optional: names and avatars come from Steam with it; without it the
  // coordinator's names and a default avatar are shown.
  STEAM_API_KEY: z.string().optional(),

  // The Frontress game coordinator: everything this site shows comes from it.
  GC_URL: z.url(),
  // The coordinator's admin key (gc.json admin_key / $GC_ADMIN_KEY). Without it
  // the admin panel and the private part of the player's own profile are off.
  GC_ADMIN_KEY: z.string().optional(),
  // The coordinator's address as game servers reach it (tf_gc_server_url),
  // shown with a new server key. Default: GC_URL.
  GC_PUBLIC_URL: z.url().optional(),

  // Who may moderate (ban, review reports, end matches) and who may also
  // handle payments. SteamID64s, comma-separated.
  ADMINS: steamIdList,
  SUPER_USERS: steamIdList,

  THUMBNAIL_SERVICE_URL: z.url().default('https://mapthumbnails.tf2pickup.org'),
  // Where players get the game.
  DOWNLOAD_URL: z.url().optional(),
  DISCORD_INVITE_URL: z.url().optional(),
})

export const environment = environmentSchema.parse(process.env)
