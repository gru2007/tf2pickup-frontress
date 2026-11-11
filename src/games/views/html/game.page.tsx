import { resolve } from 'node:path'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Layout } from '../../../html/layout'
import { GameSummary } from './game-summary'
import { GameSlotList } from './game-slot-list'
import { Footer } from '../../../html/components/footer'
import { makeTitle } from '../../../html/make-title'
import { AdminToolbox } from './admin-toolbox'
import { requestContext } from '@fastify/request-context'
import type { GcMatch } from '../../../gc/schemas'
import { matchTitle } from '../../match-title'
import { PlayerRole } from '../../../auth/player-role'
import { GameResults } from './game-results'
import { getPlayerSummaries } from '../../../steam/get-player-summaries'
import type { SteamId64 } from '../../../shared/types/steam-id-64'

export async function GamePage(props: { game: GcMatch }) {
  const { game } = props
  const user = requestContext.get('user')
  const summaries = await getPlayerSummaries((game.members ?? []).map(m => m.steam_id as SteamId64))
  return (
    <Layout
      title={makeTitle(`game ${game.match_id}`)}
      description={gameDescription(game)}
      canonical={`/games/${game.match_id}`}
      embedStyle={resolve(import.meta.dirname, 'style.css')}
    >
      <NavigationBar />
      <Page>
        <div class="game-page config-frontress relative container mx-auto">
          <GameSummary game={game} />
          <GameSlotList game={game} summaries={summaries} />
          <GameResults game={game} />

          {user?.player.roles.includes(PlayerRole.admin) && <AdminToolbox game={game} />}
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}

function gameDescription(game: GcMatch) {
  const parts = [matchTitle(game), game.map]
  if (game.result) {
    parts.push(`RED ${game.result.red_score} : ${game.result.blue_score} BLU`)
  } else {
    parts.push(game.state === 'ended' ? 'ended' : 'live')
  }
  return parts.join(' · ')
}
