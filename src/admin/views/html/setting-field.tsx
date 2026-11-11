import type { Children } from '@kitajs/html'

// One setting, laid out the way the pickup admin pages laid out theirs.
export function SettingField(props: {
  id: string
  label: string
  description?: string | undefined
  children: Children
}) {
  return (
    <dl>
      <dt>
        <label for={props.id} safe>
          {props.label}
        </label>
      </dt>
      <dd class="flex flex-col gap-1">
        <div class="flex flex-row flex-wrap items-center gap-2">{props.children}</div>
        {props.description && (
          <span class="text-abru-light-75 text-sm" safe>
            {props.description}
          </span>
        )}
      </dd>
    </dl>
  )
}

export function NumberSetting(props: {
  id?: string | undefined
  name: string
  label: string
  value: number
  unit?: string | undefined
  description?: string
  min?: number | undefined
}) {
  return (
    <SettingField id={props.id ?? props.name} label={props.label} description={props.description}>
      <input
        type="number"
        name={props.name}
        id={props.id ?? props.name}
        value={String(props.value)}
        min={props.min === undefined ? undefined : String(props.min)}
        class="w-32"
      />
      {props.unit && (
        <span class="text-white" safe>
          {props.unit}
        </span>
      )}
    </SettingField>
  )
}

export function TextSetting(props: {
  id?: string | undefined
  name: string
  label: string
  value: string
  description?: string | undefined
  placeholder?: string
}) {
  return (
    <SettingField id={props.id ?? props.name} label={props.label} description={props.description}>
      <input
        type="text"
        name={props.name}
        id={props.id ?? props.name}
        value={props.value}
        placeholder={props.placeholder}
        class="w-full max-w-xl"
      />
    </SettingField>
  )
}

export function ListSetting(props: {
  id?: string | undefined
  name: string
  label: string
  values: string[]
  description?: string | undefined
  rows?: number
}) {
  const safeValue = props.values.join('\n')
  return (
    <SettingField id={props.id ?? props.name} label={props.label} description={props.description}>
      <textarea
        name={props.name}
        id={props.id ?? props.name}
        rows={String(props.rows ?? 4)}
        class="w-full max-w-xl font-mono text-sm"
      >
        {safeValue}
      </textarea>
    </SettingField>
  )
}

export function CheckboxSetting(props: {
  id?: string | undefined
  name: string
  label: string
  checked: boolean
  description?: string | undefined
}) {
  return (
    <div class="form-checkbox">
      <input
        type="checkbox"
        name={props.name}
        id={props.id ?? props.name}
        checked={props.checked}
      />
      <label for={props.id ?? props.name} safe>
        {props.label}
      </label>
      {props.description && (
        <p class="description" safe>
          {props.description}
        </p>
      )}
    </div>
  )
}
