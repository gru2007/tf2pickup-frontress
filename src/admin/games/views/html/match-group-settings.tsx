import type { GcSettings } from '../../../../gc/schemas'
import { SettingsForm } from '../../../views/html/settings-form'
import {
  CheckboxSetting,
  NumberSetting,
  SettingField,
  TextSetting,
} from '../../../views/html/setting-field'

// TF2's ETFMatchGroup: which matchmaking panel a queue belongs to in the game.
export const matchGroupNames: Record<number, string> = {
  0: 'MvM practice',
  1: 'MvM Mann Up',
  2: 'Ladder 6v6',
  3: 'Ladder 9v9',
  4: 'Ladder 12v12',
  5: 'Casual 6v6',
  6: 'Casual 9v9',
  7: 'Casual 12v12',
}

// The queues: who plays, how many, and how long the coordinator waits.
export function MatchGroupSettings(props: { settings: GcSettings['settings'] }) {
  const { sections, revision } = props.settings
  const regions = sections.regions ?? []
  return (
    <>
      {(sections.match_groups ?? []).map(group => {
        const prefix = `group-${group.match_group}`
        return (
          <SettingsForm
            action={`/admin/games/groups/${group.match_group}`}
            revision={revision}
            title={`${group.name || 'Queue'} · match group ${group.match_group} (${matchGroupNames[group.match_group] ?? 'custom'})`}
          >
            <CheckboxSetting
              name="enabled"
              id={`${prefix}-enabled`}
              label="Enabled"
              checked={group.enabled}
              description="Only enabled queues are offered in the game. Switching a queue off stops the parties searching in it; running matches finish."
            />
            <TextSetting id={`${prefix}-name`} name="name" label="Name" value={group.name} />
            <SettingField
              id={`${prefix}-mode`}
              label="Mode"
              description="Frontline matches take late joiners while they run; ranked rosters are formed once."
            >
              <select name="mode" id={`${prefix}-mode`}>
                <option value="frontline" selected={group.mode !== 'ranked'}>
                  frontline
                </option>
                <option value="ranked" selected={group.mode === 'ranked'}>
                  ranked
                </option>
              </select>
            </SettingField>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <NumberSetting
                name="min_players"
                id={`${prefix}-min_players`}
                label="Minimum players"
                value={group.min_players}
                min={2}
                description="Even. The smallest match after waiting."
              />
              <NumberSetting
                name="ideal_players"
                id={`${prefix}-ideal_players`}
                label="Ideal players"
                value={group.ideal_players}
                description="What the coordinator holds out for."
              />
              <NumberSetting
                name="max_players"
                id={`${prefix}-max_players`}
                label="Maximum players"
                value={group.max_players}
                description="Even. Both teams together."
              />
            </div>
            <NumberSetting
              name="patient_secs"
              id={`${prefix}-patient_secs`}
              label="Patience"
              value={group.patient_secs}
              unit="seconds"
              description="How long to wait for the ideal size before settling for the minimum."
            />
            <NumberSetting
              name="backfill_secs"
              id={`${prefix}-backfill_secs`}
              label="Backfill"
              value={group.backfill_secs}
              unit="seconds"
              description="0: running matches take late joiners for as long as they run; a positive value stops after that long; -1 never."
            />
            <SettingField
              id={`${prefix}-region`}
              label="Region"
              description="Only servers of this region host this queue's matches."
            >
              <select name="region" id={`${prefix}-region`}>
                <option value="" selected={!group.region}>
                  any
                </option>
                {regions.map(r => (
                  <option value={r.id} selected={group.region === r.id} safe>
                    {`${r.id} · ${r.name}`}
                  </option>
                ))}
              </select>
            </SettingField>
          </SettingsForm>
        )
      })}
      {(sections.match_groups ?? []).length > 1 && <DeleteQueues settings={props.settings} />}

      <SettingsForm action="/admin/games/groups" revision={revision} title="Add a queue">
        <NumberSetting
          name="match_group"
          id="new-match_group"
          label="Match group"
          value={7}
          description={`TF2's match group: ${Object.entries(matchGroupNames)
            .map(([id, name]) => `${id} ${name}`)
            .join(', ')}. The new queue starts switched off; pick its maps on the Map pool page.`}
        />
        <TextSetting id="new-name" name="name" label="Name" value="" />
      </SettingsForm>
    </>
  )
}

function DeleteQueues(props: { settings: GcSettings['settings'] }) {
  return (
    <SettingsForm
      action="/admin/games/groups/delete"
      revision={props.settings.revision}
      title="Remove a queue"
    >
      <SettingField
        id="delete-group"
        label="Queue"
        description="Removes the queue from the configuration. Parties searching in it stop; running matches finish."
      >
        <select name="id" id="delete-group">
          {(props.settings.sections.match_groups ?? []).map(g => (
            <option value={String(g.match_group)} safe>
              {`${g.match_group} · ${g.name}`}
            </option>
          ))}
        </select>
      </SettingField>
    </SettingsForm>
  )
}
