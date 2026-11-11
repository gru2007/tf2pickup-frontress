import { resolve } from 'node:path'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Layout } from '../../../html/layout'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import { GameListItem } from './game-list-item'
import { Pagination, paginate } from '../../../html/components/pagination'
import { makeTitle } from '../../../html/make-title'
import { gc } from '../../../gc'
import { CoordinatorStatus } from './coordinator-status'

const itemsPerPage = 8

export async function GameListPage(props: { page: number; home?: boolean }) {
  return (
    <Layout
      title={props.home ? undefined : makeTitle('games')}
      description={`games - page ${props.page}`}
      canonical={props.home ? '/' : '/games'}
      embedStyle={resolve(import.meta.dirname, 'game-list.css')}
    >
      <NavigationBar />
      <Page>
        <div class="container mx-auto">
          <CoordinatorStatus />
          <div class="text-abru-light-75 my-9 text-[48px] font-bold">Games</div>
          <div class="contents" id="gameList">
            <GameList {...props} />
          </div>
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}

export async function GameList(props: { page: number }) {
  const { page } = props
  const result = await gc.matches({ offset: (page - 1) * itemsPerPage, limit: itemsPerPage })
  const { last, around } = paginate(page, itemsPerPage, result.total)
  const games = result.matches ?? []

  return games.length > 0 ? (
    <>
      <div class="game-list" style="view-transition-name: game-list">
        {games.map(game => (
          <GameListItem game={game} />
        ))}
      </div>
      <Pagination
        hrefFn={page => `/games?page=${page}`}
        lastPage={last}
        currentPage={page}
        around={around}
        hxTarget="#gameList"
      />
    </>
  ) : (
    <p class="text-abru-light-50">No games yet.</p>
  )
}
