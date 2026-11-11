import { requestContext } from '@fastify/request-context'
import { gc } from '../../gc'
import { GameLiveIndicator } from './game-live-indicator'

export async function GamesLink() {
  const gamesLiveCount = await gc
    .status()
    .then(status => status.live_matches)
    .catch(() => 0)
  const url = requestContext.get('url')
  return (
    <a
      href="/games"
      class="nav-menu-item"
      data-accent={gamesLiveCount > 0 ? 'true' : undefined}
      id="navbar-games-link"
      aria-current={url === '/games' ? 'page' : undefined}
    >
      {gamesLiveCount > 0 ? <GameLiveIndicator /> : <></>}
      Games
    </a>
  )
}
