import type { GcSettings } from '../../../../gc/schemas'
import { SettingsForm } from '../../../views/html/settings-form'
import { CheckboxSetting, ListSetting, NumberSetting } from '../../../views/html/setting-field'

// Who may queue, per queue, and what chat lets through.
export function RestrictionSettings(props: { settings: GcSettings['settings'] }) {
  const { sections, revision } = props.settings
  return (
    <>
      {(sections.match_groups ?? []).map(group => {
        const r = group.restrictions
        const p = `r-${group.match_group}`
        return (
          <SettingsForm
            action={`/admin/player-restrictions/${group.match_group}`}
            revision={revision}
            title={`Who may queue for ${group.name}`}
          >
            <CheckboxSetting
              id={`${p}-verified`}
              name="require_verified_auth"
              label="Steam-verified accounts only"
              checked={r.require_verified_auth}
              description="Needs the coordinator in webapi auth mode."
            />
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberSetting
                id={`${p}-max-party`}
                name="max_party_size"
                label="Largest party"
                value={r.max_party_size}
                description="0: half a match."
              />
              <NumberSetting
                id={`${p}-min-party`}
                name="min_party_size"
                label="Smallest party"
                value={r.min_party_size}
              />
              <NumberSetting
                id={`${p}-min-matches`}
                name="min_matches_played"
                label="Matches played"
                value={r.min_matches_played}
                description="Finished matches a player needs first."
              />
              <NumberSetting
                id={`${p}-cooldown`}
                name="abandon_cooldown_mins"
                label="Abandon cooldown"
                value={r.abandon_cooldown_mins}
                unit="minutes"
                description="After leaving a running match."
              />
              <NumberSetting
                id={`${p}-max-abandons`}
                name="max_abandons"
                label="Abandons allowed"
                value={r.max_abandons}
                description="0: no limit."
              />
            </div>
            <ListSetting
              id={`${p}-allowed`}
              name="allowed_steam_ids"
              label="Only these players"
              values={r.allowed_steam_ids ?? []}
              description="SteamID64s, one per line. Empty: everybody. For closed tests."
            />
            <ListSetting
              id={`${p}-banned`}
              name="banned_steam_ids"
              label="Never these players"
              values={r.banned_steam_ids ?? []}
              description="SteamID64s kept out of this queue only. For a ban everywhere use a player's Bans page."
            />
          </SettingsForm>
        )
      })}

      <SettingsForm action="/admin/player-restrictions/chat" revision={revision} title="Chat">
        <CheckboxSetting
          name="disabled"
          label="Chat off"
          checked={sections.chat.disabled}
          description="The main menu's global, clan and party chat."
        />
        <NumberSetting
          name="history"
          label="History"
          value={sections.chat.history}
          unit="lines"
          description="What each channel keeps for players who come later."
        />
        <ListSetting
          name="muted_steam_ids"
          label="Muted players"
          values={sections.chat.muted_steam_ids ?? []}
          description="SteamID64s, one per line. They can read but not write."
        />
        <ListSetting
          name="banned_words"
          label="Starred-out words"
          values={sections.chat.banned_words ?? []}
          description="One per line, case-insensitive."
        />
      </SettingsForm>
    </>
  )
}
