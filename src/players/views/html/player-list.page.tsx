import { resolve } from 'node:path'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Layout } from '../../../html/layout'
import { deburr } from 'es-toolkit'
import { gc } from '../../../gc'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import { makeTitle } from '../../../html/make-title'
import { firstNonEmpty } from '../../../utils/first-non-empty'

const latin = Array.from(Array(26)).map((_e, i) => String.fromCharCode(i + 65))

interface ListedPlayer {
  steamId: string
  name: string
}

const pageSize = 200
const maxPlayers = 5000

async function fetchPlayers(q: string | undefined): Promise<ListedPlayer[]> {
  const out: ListedPlayer[] = []
  for (let offset = 0; offset < maxPlayers; offset += pageSize) {
    const page = await gc.players({ q, sort: 'recent', offset, limit: pageSize })
    out.push(
      ...page.players.map(p => ({
        steamId: p.steam_id,
        name: firstNonEmpty(p.name) ?? p.steam_id,
      })),
    )
    if (offset + pageSize >= page.total) {
      break
    }
  }
  return out
}

export async function PlayerListPage(props: { q?: string | undefined } = {}) {
  const players = await fetchPlayers(props.q)
  const groupedPlayers = groupPlayers(players)

  // Append non-Latin letters (e.g. Cyrillic) only when this instance's players use them.
  const extraGroups = Array.from(groupedPlayers.keys())
    .filter(key => key !== '#' && !latin.includes(key))
    .sort((a, b) => a.localeCompare(b))
  const groups = ['#', ...latin, ...extraGroups]

  return (
    <Layout
      title={makeTitle('players')}
      description="player list"
      canonical="/players"
      embedStyle={resolve(import.meta.dirname, 'style.css')}
    >
      <NavigationBar />
      <Page>
        <div class="container mx-auto">
          <div class="my-9 flex flex-row flex-wrap items-center gap-4">
            <div class="text-abru-light-75 text-[48px] font-bold">Players</div>
            <form method="get" action="/players" class="ml-auto flex flex-row gap-2">
              <input type="text" name="q" value={props.q ?? ''} placeholder="Name or SteamID" />
              <button type="submit" class="button" data-size="dense">
                Search
              </button>
            </form>
          </div>

          <div class="player-list-index">
            {groups.map(letter => (
              <a href={`#${letter}`} style="uppercase" safe>
                {letter}
              </a>
            ))}
          </div>

          {groups.map(letter => (
            <div class="player-list-section">
              <div class="section-divider"></div>
              <a id={letter} class="section-letter" safe>
                {letter}
              </a>

              <div class="player-group">
                {groupedPlayers.get(letter)?.map(player => (
                  <a href={`/players/${player.steamId}`} safe>
                    {player.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}

function groupPlayers(players: ListedPlayer[]): Map<string, ListedPlayer[]> {
  return players.reduce((result, player) => {
    const first = player.name
      .replace(
        /[\s\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu,
        '',
      )
      .charAt(0)

    let key: string
    if (/\p{Script=Cyrillic}/u.test(first)) {
      key = first.toLocaleUpperCase('ru')
      if (key === 'Ё') key = 'Е'
    } else {
      key = deburr(first).toLocaleUpperCase()
      if (!/[a-zA-Z]/.test(key)) {
        key = '#'
      }
    }

    if (!result.has(key)) {
      result.set(key, [])
    }
    result.get(key)!.push(player)

    return result
  }, new Map<string, ListedPlayer[]>())
}
