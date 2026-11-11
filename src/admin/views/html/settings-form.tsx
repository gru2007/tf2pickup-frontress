import type { Children } from '@kitajs/html'
import { requestContext } from '@fastify/request-context'
import { PlayerRole } from '../../../auth/player-role'
import { SaveButton } from './save-button'

// A form that saves part of the coordinator's configuration. Only super users
// change settings; admins see them read-only.
export function SettingsForm(props: {
  action: string
  revision: number
  title?: string
  children: Children
}) {
  const user = requestContext.get('user')
  const canEdit = user?.player.roles.includes(PlayerRole.superUser) ?? false
  return (
    <form action={props.action} method="post" class="admin-panel-set mt-4" hx-boost="false">
      <input type="hidden" name="revision" value={String(props.revision)} />
      {props.title && (
        <h4 class="pb-4" safe>
          {props.title}
        </h4>
      )}
      <fieldset class="flex flex-col gap-4" disabled={!canEdit}>
        {props.children}
        {canEdit ? (
          <div>
            <SaveButton />
          </div>
        ) : (
          <></>
        )}
      </fieldset>
    </form>
  )
}
