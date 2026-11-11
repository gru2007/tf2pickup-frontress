import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { SettingsForm } from '../../../views/html/settings-form'
import {
  CheckboxSetting,
  ListSetting,
  NumberSetting,
  SettingField,
  TextSetting,
} from '../../../views/html/setting-field'

// The rest of the coordinator's settings: its name, regions and ping, Easy
// Anti-Cheat, deadlines and webhooks.
export async function MiscellaneousPage() {
  const { settings } = await gc.settings()
  const s = settings.sections
  const b = settings.bootstrap
  const restart = new Set(settings.restart_pending)
  return (
    <Admin activePage="miscellaneous">
      {settings.restart_pending.length > 0 && (
        <div class="banner mb-4" data-tone="alert" safe>
          {`Saved, but the running coordinator still uses the old value of: ${settings.restart_pending.join(', ')}. Restart it to apply.`}
        </div>
      )}

      <SettingsForm
        action="/admin/miscellaneous/general"
        revision={settings.revision}
        title="General"
      >
        <TextSetting
          name="name"
          label="Coordinator name"
          value={s.name}
          description="What players see in the game."
        />
      </SettingsForm>

      <SettingsForm
        action="/admin/miscellaneous/regions"
        revision={settings.revision}
        title="Regions and ping"
      >
        <ListSetting
          name="regions"
          label="Regions"
          rows={5}
          values={(s.regions ?? []).map(r => `${r.id} | ${r.name} | ${(r.pops ?? []).join(', ')}`)}
          description="One per line: id | name | Steam relay data centers (fra, ams, iad...). A player belongs to the region of the data center they ping best; servers say their region with their key or tf_gc_server_region. Empty: one pool."
        />
        <NumberSetting
          name="region_wait_secs"
          label="Region wait"
          value={s.region_wait_secs}
          unit="seconds"
          description="After this long a party plays with anyone, on any server. 0: 120."
        />
        <NumberSetting
          name="max_ms"
          label="Highest ping"
          value={s.server_ping.max_ms}
          unit="ms"
          description="A match only goes to a server every player reaches within this. 0: 200; -1: only check the server answers."
        />
        <NumberSetting
          name="answer_secs"
          label="Ping answer wait"
          value={s.server_ping.answer_secs}
          unit="seconds"
          description="How long a player's pings are waited for. 0: 15."
        />
      </SettingsForm>

      <SettingsForm
        action="/admin/miscellaneous/anticheat"
        revision={settings.revision}
        title="Easy Anti-Cheat"
      >
        <CheckboxSetting
          name="require_protected_servers"
          label="Protected servers only"
          checked={s.anticheat.require_protected_servers}
          description="Matches only go to servers running an Easy Anti-Cheat protected session."
        />
        <NumberSetting
          name="temp_ban_hours"
          label="Temporary ban"
          value={s.anticheat.temp_ban_hours}
          unit="hours"
          description="How long an EAC temporary ban keeps a player out of matchmaking. 0: 24."
        />
        <SettingField
          id="steam_game_bans"
          label="Steam game bans"
          description={
            b.publisher_key_set
              ? 'manual: a moderator may add one to a permanent ban; auto: also every permanent EAC ban from a server whose key has anti-cheat authority.'
              : 'Needs the Steam publisher key on the coordinator (support.publisher_key or $STEAM_PUBLISHER_KEY).'
          }
        >
          <select name="steam_game_bans" id="steam_game_bans">
            {['off', 'manual', 'auto'].map(mode => (
              <option
                value={mode}
                selected={
                  s.anticheat.steam_game_bans.mode === mode ||
                  (mode === 'off' && !s.anticheat.steam_game_bans.mode)
                }
              >
                {mode}
              </option>
            ))}
          </select>
        </SettingField>
        <CheckboxSetting
          name="immediate"
          label="No ban delay"
          checked={s.anticheat.steam_game_bans.immediate}
          description="Skip Valve's delay. Leave it off: the delay keeps cheat sellers from learning which session was caught."
        />
        <CheckboxSetting
          name="forward_player_reports"
          label="Forward cheating reports to Steam"
          checked={s.anticheat.steam_game_bans.forward_player_reports}
        />
      </SettingsForm>

      <SettingsForm
        action="/admin/miscellaneous/timing"
        revision={settings.revision}
        title="Deadlines"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberSetting
            name="server_boot_secs"
            label="Server setup"
            value={s.timing.server_boot_secs}
            unit="seconds"
            description="A formed match waits this long for its server; then its parties go back to the queue. 0: 300."
          />
          <NumberSetting
            name="server_lost_secs"
            label="Server lost"
            value={s.timing.server_lost_secs}
            unit="seconds"
            description="A running match survives its server going silent this long. 0: 120."
          />
          <NumberSetting
            name="no_show_secs"
            label="No-show"
            value={s.timing.no_show_secs}
            unit="seconds"
            description="A match nobody joined ends after this. 0: 300."
          />
          <NumberSetting
            name="max_match_secs"
            label="Longest match"
            value={s.timing.max_match_secs}
            unit="seconds"
            description="0: 3 hours."
          />
          <NumberSetting
            name="offline_grace_secs"
            label="Offline grace"
            value={s.timing.offline_grace_secs}
            unit="seconds"
            description="A queued party keeps its place this long after a member's game went quiet. 0: 30."
          />
          <NumberSetting
            name="tick_millis"
            label={`Tick${restart.has('timing.tick_millis') ? ' (restart pending)' : ''}`}
            value={s.timing.tick_millis}
            unit="ms"
            description="Applies after a restart. 0: 1000."
          />
          <NumberSetting
            name="session_ttl_secs"
            label={`Session timeout${restart.has('timing.session_ttl_secs') ? ' (restart pending)' : ''}`}
            value={s.timing.session_ttl_secs}
            unit="seconds"
            description="Applies after a restart. 0: 60."
          />
          <NumberSetting
            name="poll_secs"
            label={`Long-poll${restart.has('timing.poll_secs') ? ' (restart pending)' : ''}`}
            value={s.timing.poll_secs}
            unit="seconds"
            description="Applies after a restart. 0: 25."
          />
        </div>
      </SettingsForm>

      <SettingsForm
        action="/admin/miscellaneous/webhooks"
        revision={settings.revision}
        title="Webhooks"
      >
        <ListSetting
          name="webhooks"
          label="Hooks"
          rows={5}
          values={(s.webhooks ?? []).map(
            w => `${w.name} | ${w.url} | ${w.secret} | ${(w.events ?? []).join(', ')}`,
          )}
          description="One per line: name | URL | secret (signs X-Frontress-Signature) | events (empty: all): match_started, match_result, match_ended, quest_finished, war_sector_captured, war_campaign_won, war_campaign_started."
        />
      </SettingsForm>

      <div class="admin-panel-set mt-4">
        <h4 class="pb-4">Set in gc.json (needs a restart)</h4>
        <dl class="text-abru-light-75 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt>Listen</dt>
          <dd safe>{b.listen}</dd>
          <dt>Data directory</dt>
          <dd safe>
            {b.data_dir || 'none: a restart forgets everything, including these settings'}
          </dd>
          <dt>Steam authentication</dt>
          <dd
            safe
          >{`${b.auth_mode}${b.app_ids?.length ? ` · AppID ${b.app_ids.join(', ')}` : ''}`}</dd>
          <dt>Payments</dt>
          <dd>{b.support_enabled ? (b.support_sandbox ? 'on (sandbox)' : 'on (live)') : 'off'}</dd>
          <dt>War</dt>
          <dd safe>{b.war_enabled ? `on · ${b.war_theater ?? ''}` : 'off'}</dd>
        </dl>
      </div>
    </Admin>
  )
}
