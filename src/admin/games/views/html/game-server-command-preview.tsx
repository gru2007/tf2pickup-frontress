import { Html } from '@kitajs/html'
import { environment } from '../../../../environment'
import { LogsTfUploadMethod } from '../../../../shared/types/logs-tf-upload-method'

// keep in sync with compileConfig() in src/games/rcon/configure.ts
export function GameServerCommandPreview(props: {
  whitelistId: string | null
  executeExtraCommands: string[]
  logsTfUploadMethod: LogsTfUploadMethod
}) {
  return (
    <div class="bg-abru-dark-25 flex flex-col overflow-x-auto rounded-lg p-4 font-mono text-sm whitespace-nowrap text-white">
      <span>
        logaddress_add{' '}
        {Html.escapeHtml(`${environment.LOG_RELAY_ADDRESS}:${environment.LOG_RELAY_PORT}`)}
      </span>
      <span>kickall</span>
      <span class="text-abru-light-75/60 mt-2 italic">
        {'// Frontress games stop here and take the roster-gate branch instead:'}
      </span>
      <span>
        sv_password &quot;&quot;{' '}
        <Comment text="a matchmaking server may not hold one - the roster is the gate" />
      </span>
      <span>
        sv_tags &quot;tfmm:
        <Placeholder text="external match id" />
        &quot;
      </span>
      <span>
        maxplayers <Placeholder text="max players" />
      </span>
      <span>
        tf_match_emulation <Placeholder text="0, 1 or 2" />
      </span>
      <span>tf_match_emulation_restartmatch 0</span>
      <span>tf_match_emulation_randommap 0</span>
      <span>
        tf_mm_trusted <Placeholder text="0 or 1" />
      </span>
      <span>
        exec <Placeholder text="ruleset" />{' '}
        <Comment text="only if the match specifies a server config" />
      </span>
      <span>
        tf_mm_match_begin <Placeholder text="match id" /> <Placeholder text="match group" />{' '}
        <Placeholder text="map" /> <Placeholder text="ruleset" />{' '}
        <Placeholder text="fallback password" /> <Placeholder text="roster" />{' '}
        <Placeholder text="max players" />{' '}
        <Comment text="changes the map itself; must answer TFMM_MATCH_BEGIN_OK" />
      </span>
      <span class="text-abru-light-75/60 mt-2 italic">
        {'// Everything below is the pickup branch:'}
      </span>
      <span>
        changelevel <Placeholder text="map" />{' '}
        <Comment text="skipped on serveme.tf servers - they start with the right map" />
      </span>
      <span>
        exec <Placeholder text="map config" />{' '}
        <Comment text="only if the map has a config assigned" />
      </span>
      {props.whitelistId ? (
        <span safe>tftrue_whitelist_id {props.whitelistId}</span>
      ) : (
        <span class="italic opacity-40">
          <Comment text="tftrue_whitelist_id skipped - no whitelist ID set" />
        </span>
      )}
      <span>
        sv_password <Placeholder text="generated password" />
      </span>
      <span>
        sm_game_player_add <Placeholder text="steamId" /> -name <Placeholder text="name" /> -team{' '}
        <Placeholder text="team" /> -class <Placeholder text="class" />{' '}
        <Comment text="one line per player" />
      </span>
      <span>sm_game_player_whitelist 1</span>
      <span>
        logstf_title {Html.escapeHtml(environment.WEBSITE_NAME)} #
        <Placeholder text="game number" />
      </span>
      <span>
        logstf_autoupload {props.logsTfUploadMethod === LogsTfUploadMethod.gameserver ? '2' : '0'}
      </span>
      {props.executeExtraCommands
        .filter(command => command.length > 0)
        .map(command => (
          <span safe>{command}</span>
        ))}
    </div>
  )
}

function Placeholder(props: { text: string }) {
  return (
    <span class="text-abru-light-75 italic" safe>
      {`<${props.text}>`}
    </span>
  )
}

function Comment(props: { text: string }) {
  return <span class="text-abru-light-75/60 italic" safe>{`// ${props.text}`}</span>
}
