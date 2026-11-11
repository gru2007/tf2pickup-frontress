import type { SteamId64 } from '../../shared/types/steam-id-64'
import { firstNonEmpty } from '../../utils/first-non-empty'

// A link to a player's profile, labelled with the best name we have.
export function PlayerLink(props: {
  steamId: SteamId64 | string
  name?: string | undefined
  class?: string | undefined
}) {
  return (
    <a href={`/players/${props.steamId}`} class={props.class} safe>
      {firstNonEmpty(props.name) ?? props.steamId}
    </a>
  )
}
