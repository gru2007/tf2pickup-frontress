import { resolve } from 'node:path'
import { Layout } from '../../../html/layout'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import { playerAvatarUrl } from '../../../shared/player-avatar-url'
import { gc } from '../../../gc'
import type { GcPlayerListEntry } from '../../../gc/schemas'
import { getPlayerSummaries, type PlayerSummary } from '../../../steam/get-player-summaries'
import type { SteamId64 } from '../../../shared/types/steam-id-64'
import { IconAwardFilled } from '../../../html/components/icons'
import { makeTitle } from '../../../html/make-title'

interface HallOfFameEntry {
  player: GcPlayerListEntry
  summary: PlayerSummary | undefined
  count: number
}

export async function HallOfFamePage() {
  const [byMatches, byLevel] = await Promise.all([
    gc.players({ sort: 'matches', limit: 10 }),
    gc.players({ sort: 'level', limit: 10 }),
  ])
  const summaries = await getPlayerSummaries(
    [...byMatches.players, ...byLevel.players].map(p => p.steam_id as SteamId64),
  )
  const entries = (players: GcPlayerListEntry[], count: (p: GcPlayerListEntry) => number) =>
    players.map(player => ({
      player,
      summary: summaries.get(player.steam_id as SteamId64),
      count: count(player),
    }))
  const all = entries(byMatches.players, p => p.matches)
  const levels = entries(byLevel.players, p => p.level)

  return (
    <Layout
      title={makeTitle('Hall of fame')}
      description="Hall of fame"
      canonical="/hall-of-fame"
      embedStyle={resolve(import.meta.dirname, 'hall-of-fame.page.css')}
    >
      <NavigationBar />
      <Page>
        <div class="container mx-auto grid grid-cols-1 gap-x-4 gap-y-2 p-2 lg:grid-cols-2 lg:gap-y-0 lg:p-0">
          <div class="text-abru-light-75 my-9 text-[48px] font-bold lg:col-span-2">
            Hall of Fame
          </div>

          <Board title="Most matches" entries={all} />
          <Board title="Highest level" entries={levels} />
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}

function Board(props: { title: string; entries: HallOfFameEntry[] }) {
  return (
    <div class="hof-board">
      <div class="title col-span-4" safe>
        {props.title}
      </div>
      {props.entries.map((record, i) => (
        <a class="hof-record" href={`/players/${record.player.steam_id}`} preload="mousedown">
          <MaybeAward i={i} />
          <img
            src={playerAvatarUrl(record.summary?.avatar, 'medium')}
            width="64"
            height="64"
            class="h-[38px] w-[38px]"
            alt={`${record.player.name}'s avatar`}
          />
          <span safe>{record.summary?.name ?? record.player.name}</span>
          <span class="justify-self-end">{record.count}</span>
        </a>
      ))}
    </div>
  )
}

function MaybeAward(props: { i: number }) {
  switch (props.i) {
    case 0:
      return <IconAwardFilled size={32} class="text-place-1st place-self-center"></IconAwardFilled>
    case 1:
      return <IconAwardFilled size={32} class="text-place-2nd place-self-center"></IconAwardFilled>
    case 2:
      return <IconAwardFilled size={32} class="text-place-3rd place-self-center"></IconAwardFilled>
    default:
      return <span class="place-self-center">{props.i + 1}.</span>
  }
}
