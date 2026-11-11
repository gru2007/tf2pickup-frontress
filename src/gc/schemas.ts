import { z } from 'zod'

// What the Frontress game coordinator answers. Only the fields this site uses
// are listed; anything else the coordinator adds is ignored.

const date = z.coerce.date()
// Go writes the zero time for "never".
const optionalDate = z
  .string()
  .optional()
  .transform(value => (value && !value.startsWith('0001-') ? new Date(value) : undefined))

const group = z.object({
  match_group: z.number(),
  name: z.string(),
  mode: z.string(),
  queued: z.number(),
  need: z.number(),
  ideal: z.number(),
  max: z.number(),
  matches: z.number(),
  maps: z.array(z.string()).nullish(),
})

const status = z.object({
  name: z.string(),
  online: z.number(),
  live_matches: z.number(),
  servers: z.number(),
  free_servers: z.number(),
  in_menu: z.number(),
  in_queue: z.number(),
  in_match: z.number(),
  lfg: z.number(),
  clans: z.number(),
  groups: z.array(group).nullish(),
  campaign: z.string().optional(),
  generated_at: date,
})

const member = z.object({
  steam_id: z.string(),
  name: z.string(),
  team: z.string(),
  left: z.boolean(),
  vote_kicked: z.boolean().optional(),
})

const playerResult = z.object({
  steam_id: z.string(),
  team: z.number(),
  score: z.number(),
  kills: z.number(),
  deaths: z.number(),
  damage: z.number(),
  healing: z.number(),
  support: z.number().optional(),
  classes_played: z.number().optional(),
  medals: z.array(z.number()).optional(),
  display_rating: z.number().optional(),
  display_rating_change: z.number().optional(),
  xp_change: z.number().optional(),
  excluded_from_progression: z.boolean().optional(),
})

const result = z.object({
  winning_team: z.number(),
  red_score: z.number(),
  blue_score: z.number(),
  duration: z.number(),
  status: z.number(),
  players: z.array(playerResult).nullish(),
})

const match = z.object({
  match_id: z.string(),
  match_group: z.number(),
  group_name: z.string(),
  map: z.string(),
  state: z.enum(['setup', 'run', 'ended']),
  region: z.string(),
  // casual, ranked or war; read through matchKind()
  kind: z.string().optional(),
  campaign: z.string().optional(),
  sector: z.string().optional(),
  formed_at: date,
  started_at: optionalDate,
  ended_at: optionalDate,
  reason: z.string().optional(),
  members: z.array(member).nullish(),
  result: result.nullish(),
})

const matchPage = z.object({
  matches: z.array(match).nullish(),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
})

const clanBadge = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string(),
  color: z.string().optional(),
  level: z.number(),
})

const player = z.object({
  steam_id: z.string(),
  name: z.string().optional(),
  last_match: optionalDate,
  war_campaign: z.string().optional(),
  war_side: z.string().optional(),
  matches: z.number(),
  wins: z.number(),
  losses: z.number(),
  abandons: z.number(),
  rating: z.number(),
  xp: z.number(),
  level: z.number(),
  level_xp: z.number(),
  level_xp_total: z.number(),
  clan: clanBadge.optional(),
})

const playerListEntry = z.object({
  steam_id: z.string(),
  name: z.string(),
  matches: z.number(),
  wins: z.number(),
  losses: z.number(),
  xp: z.number(),
  level: z.number(),
  last_match: optionalDate,
})

const playerList = z.object({
  players: z.array(playerListEntry),
  total: z.number(),
})

const quest = z.object({
  id: z.string(),
  kind: z.string(),
  class: z.string().optional(),
  per: z.number().optional(),
  target: z.number(),
  xp: z.number(),
  weekly: z.boolean(),
  progress: z.number(),
  done: z.boolean(),
})

const quests = z.object({
  daily: z.array(quest),
  weekly: z.array(quest),
  daily_ends: date,
  weekly_ends: date,
  completed_xp: z.number(),
})

const sanction = z.object({
  kind: z.string(),
  since: date,
  until: optionalDate,
  reason: z.string(),
  by: z.string(),
})

const steamBan = z.object({
  at: date,
  reason: z.string(),
  by: z.string(),
})

const antiCheatEvent = z.object({
  at: date,
  kind: z.string(),
  reason: z.number().optional(),
  details: z.string().optional(),
  server: z.string().optional(),
  match_id: z.string().optional(),
  enforced: z.boolean(),
})

const antiCheatRecord = z.object({
  steam_id: z.string(),
  product_user_id: z.string().optional(),
  verified_at: optionalDate,
  sanction: sanction.optional(),
  steam_ban: steamBan.optional(),
  events: z.array(antiCheatEvent).nullish(),
})

const resolution = z.object({
  at: date,
  outcome: z.string(),
  by: z.string(),
  note: z.string().optional(),
  reports: z.number(),
})

const reportCase = z.object({
  steam_id: z.string(),
  name: z.string().optional(),
  status: z.string(),
  score: z.number(),
  severity: z.string(),
  open_reports: z.number(),
  total_reports: z.number(),
  reporters: z.number(),
  reasons: z.record(z.string(), z.number()).nullish(),
  matches: z.number(),
  last_report: date,
  flags: z.array(z.string()).nullish(),
  eac: z.object({
    violations: z.number(),
    kicks: z.number(),
    vote_kicks: z.number(),
    sanction: sanction.optional(),
    steam_banned: z.boolean().optional(),
  }),
  resolution: resolution.optional(),
})

const report = z.object({
  reporter: z.string(),
  reporter_name: z.string().optional(),
  reporter_weight: z.number(),
  reason_name: z.string(),
  details: z.array(z.string()).nullish(),
  comment: z.string().optional(),
  match_id: z.string().optional(),
  map: z.string().optional(),
  at: date,
  open: z.boolean(),
})

const reportCaseDetail = reportCase.extend({
  reports: z.array(report).nullish(),
  resolutions: z.array(resolution).nullish(),
  steam_bans: z.boolean(),
  steam_ban_pending: z.boolean(),
})

const liveMember = z.object({
  steam_id: z.string(),
  name: z.string(),
  team: z.string().optional(),
  connect: z.string().optional(),
})

const live = z.object({
  status: status.nullish(),
  servers: z.array(
    z.object({
      steam_id: z.string(),
      name: z.string(),
      community: z.string(),
      region: z.string(),
      connect: z.string(),
      map: z.string(),
      state: z.string(),
      match_id: z.string().optional(),
      protected: z.boolean(),
      last_status: optionalDate,
      key_id: z.string().optional(),
      connected_at: optionalDate,
      players: z.number().default(0),
    }),
  ),
  matches: z.array(
    z.object({
      match_id: z.string(),
      match_group: z.number(),
      group_name: z.string(),
      kind: z.string().optional(),
      sector: z.string().optional(),
      map: z.string(),
      state: z.string(),
      region: z.string(),
      server: z.string(),
      formed_at: date,
      started_at: optionalDate,
      members: z.array(liveMember),
    }),
  ),
  parties: z.array(
    z.object({
      id: z.string(),
      leader: z.string(),
      members: z.array(liveMember).nullish(),
      queues: z.record(z.string(), z.number()),
    }),
  ),
})

const order = z.object({
  order: z.string(),
  steam_id: z.string(),
  name: z.string().optional(),
  kind: z.string(),
  tier: z.number(),
  amount: z.number(),
  currency: z.string(),
  opened: date,
  paid: optionalDate,
  failed: z.string().optional(),
  refunded: z.boolean(),
})

const payments = z.object({
  app_id: z.number(),
  sandbox: z.boolean(),
  orders: z.array(order).nullish(),
  transactions: z
    .array(
      z.object({
        orderid: z.string(),
        transid: z.string(),
        steamid: z.string(),
        status: z.string(),
        currency: z.string(),
        time: z.string().optional(),
        agreementid: z.string().optional(),
        agreementstatus: z.string().optional(),
        nextpayment: z.string().optional(),
        items: z.array(z.object({ amount: z.number(), vat: z.number() })).nullish(),
      }),
    )
    .nullish(),
  operations: z
    .array(
      z.object({
        id: z.string(),
        action: z.string(),
        order: z.string().optional(),
        steam_id: z.string().optional(),
        agreement: z.string().optional(),
        actor: z.string(),
        reason: z.string(),
        state: z.string(),
        message: z.string().optional(),
        at: date,
      }),
    )
    .nullish(),
  last_sync: optionalDate,
  sync_error: z.string().optional(),
})

// The configuration the admin panel edits (see services/gc/internal/gc/settings.go).
// Objects are loose: fields this site does not edit go back to the GC unchanged.
const num = z.number().default(0)
const ids = z.array(z.string()).nullish()

const restrictions = z.looseObject({
  require_verified_auth: z.boolean().default(false),
  max_party_size: num,
  min_party_size: num,
  min_matches_played: num,
  abandon_cooldown_mins: num,
  max_abandons: num,
  allowed_steam_ids: ids,
  banned_steam_ids: ids,
})

const matchGroup = z.looseObject({
  match_group: z.number(),
  name: z.string().default(''),
  enabled: z.boolean().default(false),
  mode: z.string().default(''),
  min_players: num,
  ideal_players: num,
  max_players: num,
  patient_secs: num,
  backfill_secs: num,
  modes: z.array(z.string()).nullish(),
  maps: z.array(z.string()).nullish(),
  region: z.string().optional(),
  restrictions: restrictions.default({
    require_verified_auth: false,
    max_party_size: 0,
    min_party_size: 0,
    min_matches_played: 0,
    abandon_cooldown_mins: 0,
    max_abandons: 0,
  }),
})

const sections = z.object({
  name: z.string().default(''),
  match_groups: z.array(matchGroup).nullish(),
  regions: z
    .array(z.looseObject({ id: z.string(), name: z.string().default(''), pops: ids }))
    .nullish(),
  region_wait_secs: num,
  server_ping: z
    .looseObject({ max_ms: num, answer_secs: num })
    .default({ max_ms: 0, answer_secs: 0 }),
  anticheat: z.looseObject({
    require_protected_servers: z.boolean().default(false),
    temp_ban_hours: num,
    steam_game_bans: z
      .looseObject({
        mode: z.string().default('off'),
        immediate: z.boolean().default(false),
        forward_player_reports: z.boolean().default(false),
      })
      .default({ mode: 'off', immediate: false, forward_player_reports: false }),
  }),
  chat: z.looseObject({
    disabled: z.boolean().default(false),
    history: num,
    muted_steam_ids: ids,
    banned_words: ids,
  }),
  timing: z.looseObject({
    tick_millis: num,
    session_ttl_secs: num,
    poll_secs: num,
    server_boot_secs: num,
    server_lost_secs: num,
    no_show_secs: num,
    max_match_secs: num,
    offline_grace_secs: num,
  }),
  map_index: z.record(z.string(), z.number()).nullish(),
  webhooks: z
    .array(
      z.looseObject({
        name: z.string().default(''),
        url: z.string(),
        secret: z.string().default(''),
        events: ids,
      }),
    )
    .nullish(),
})

const settings = z.object({
  settings: z.object({
    revision: z.number(),
    updated_at: optionalDate,
    updated_by: z.string().optional(),
    persisted: z.boolean(),
    from_panel: z.array(z.string()),
    sections,
    restart_pending: z.array(z.string()),
    bootstrap: z.object({
      listen: z.string(),
      data_dir: z.string(),
      auth_mode: z.string(),
      app_ids: z.array(z.number()).nullish(),
      support_enabled: z.boolean(),
      support_sandbox: z.boolean(),
      war_enabled: z.boolean(),
      war_theater: z.string().optional(),
      publisher_key_set: z.boolean(),
    }),
  }),
  catalog: z.object({ modes: z.record(z.string(), z.array(z.string())) }).optional(),
})

const settingsHistory = z.object({
  revisions: z.array(
    z.object({
      revision: z.number(),
      updated_at: optionalDate,
      updated_by: z.string().optional(),
      note: z.string().optional(),
      sections: z.record(z.string(), z.unknown()),
    }),
  ),
})

const serverKeys = z.object({
  keys: z.array(
    z.object({
      name: z.string(),
      key_id: z.string(),
      community: z.string().optional(),
      region: z.string().optional(),
      anticheat_authority: z.boolean(),
      source: z.string(),
      servers: z.array(live.shape.servers.element),
    }),
  ),
})

const journalEntry = z.object({
  seq: z.number(),
  at: date,
  level: z.string(),
  msg: z.string(),
  players: z.array(z.string()).nullish(),
  server: z.string().optional(),
  match: z.string().optional(),
  lobby: z.string().optional(),
  attrs: z.record(z.string(), z.string()).nullish(),
})

const journal = z.object({
  entries: z.array(journalEntry),
  next: z.number(),
  dropped: z.number(),
})

export const gcSchemas = {
  status,
  match,
  matchPage,
  player,
  playerList,
  quests,
  antiCheatRecord,
  sanctions: z.object({ sanctions: z.array(antiCheatRecord).nullish() }),
  reportCases: z.object({ cases: z.array(reportCase).nullish() }),
  reportCaseDetail,
  live,
  payments,
  ok: z.object({ ok: z.string() }),
  settings,
  settingsHistory,
  serverKeys,
  serverKeyResult: z.object({ ok: z.string(), key: z.string().optional() }),
  journal,
}

export type GcSettings = z.infer<typeof settings>
export type GcSections = z.infer<typeof sections>
export type GcMatchGroup = z.infer<typeof matchGroup>
export type GcJournalEntry = z.infer<typeof journalEntry>

export type GcMatch = z.infer<typeof match>
export type GcPlayer = z.infer<typeof player>
export type GcPlayerListEntry = z.infer<typeof playerListEntry>
export type GcAntiCheatRecord = z.infer<typeof antiCheatRecord>
export type GcReportCase = z.infer<typeof reportCase>
export type GcLive = z.infer<typeof live>
export type GcPayments = z.infer<typeof payments>
export type GcStatus = z.infer<typeof status>
