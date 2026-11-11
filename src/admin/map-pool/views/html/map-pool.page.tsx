import { gc } from '../../../../gc'
import { Admin } from '../../../views/html/admin'
import { SettingsForm } from '../../../views/html/settings-form'
import { ListSetting, SettingField } from '../../../views/html/setting-field'

// Which maps each queue plays: whole stock modes, plus maps by name.
export async function MapPoolPage() {
  const { settings, catalog } = await gc.settings()
  const modes = catalog?.modes ?? {}
  const index = settings.sections.map_index ?? {}
  return (
    <Admin activePage="map-pool">
      {(settings.sections.match_groups ?? []).map(group => {
        const chosen = new Set(group.modes ?? [])
        const pool = new Set([
          ...(group.modes ?? []).flatMap(m => modes[m] ?? []),
          ...(group.maps ?? []),
        ])
        return (
          <SettingsForm
            action={`/admin/map-pool/${group.match_group}`}
            revision={settings.revision}
            title={`${group.name} · ${pool.size} maps`}
          >
            <SettingField
              id={`modes-${group.match_group}`}
              label="Stock modes"
              description="Every stock map of a ticked mode is in the pool."
            >
              {Object.entries(modes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([mode, list]) => (
                  <label class="bg-abru-light-5 flex items-center gap-2 rounded px-2 py-1 font-normal">
                    <input type="checkbox" name="modes" value={mode} checked={chosen.has(mode)} />
                    <span safe>{`${mode} (${list.length})`}</span>
                  </label>
                ))}
            </SettingField>
            <ListSetting
              id={`maps-${group.match_group}`}
              name="maps"
              label="More maps"
              values={group.maps ?? []}
              rows={6}
              description="One map per line: custom maps or single stock maps. Every server of the pool must have them."
            />
            <details>
              <summary class="text-abru-light-75 cursor-pointer text-sm">The pool</summary>
              <p class="text-abru-light-60 mt-2 text-sm" safe>
                {[...pool].sort().join(', ') || 'empty'}
              </p>
            </details>
          </SettingsForm>
        )
      })}

      <SettingsForm
        action="/admin/map-pool/index"
        revision={settings.revision}
        title="Map vote index"
      >
        <ListSetting
          name="map_index"
          label="Map → def index"
          values={Object.entries(index)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([map, def]) => `${map} = ${def}`)}
          rows={10}
          description="The game's casual map picker votes by def index (items_game master_maps_list). With an entry the coordinator honours the vote for that map, and offers it in the next-map vote; without, it picks the least recently played."
        />
      </SettingsForm>
    </Admin>
  )
}
