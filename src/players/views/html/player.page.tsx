import { Layout } from '../../../html/layout'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { format } from 'date-fns'
import {
  IconAwardFilled,
  IconBrandSteam,
  IconCheck,
  IconCrown,
  IconStars,
  IconSum,
  IconX,
} from '../../../html/components/icons'
import { resolve } from 'node:path'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import { GameListItem } from '../../../games/views/html/game-list-item'
import { Pagination, paginate } from '../../../html/components/pagination'
import { makeTitle } from '../../../html/make-title'
import { environment } from '../../../environment'
import { AdminToolbox } from './admin-toolbox'
import type { SteamId64 } from '../../../shared/types/steam-id-64'
import { requestContext } from '@fastify/request-context'
import { gc } from '../../../gc'
import type { GcPlayer } from '../../../gc/schemas'
import { PlayerRole } from '../../../auth/player-role'
import { rolesOf } from '../../../auth/roles-of'
import { getPlayerSummaries } from '../../../steam/get-player-summaries'
import { playerAvatarUrl } from '../../../shared/player-avatar-url'
import { classesPlayed } from '../../../games/classes-played'
import { PlayerAccount } from './player-account'
import { firstNonEmpty } from '../../../utils/first-non-empty'

const gamesPerPage = 5

export async function PlayerPage(props: { player: GcPlayer; page: number }) {
  const { player } = props
  const steamId = player.steam_id as SteamId64
  const user = requestContext.get('user')
  const summary = (await getPlayerSummaries([steamId])).get(steamId)
  const name = firstNonEmpty(summary?.name, player.name) ?? steamId
  const isMe = user?.player.steamId === steamId
  const isAdmin = user?.player.roles.includes(PlayerRole.admin) ?? false

  return (
    <Layout
      title={makeTitle(name)}
      description={`${name} · level ${player.level} · ${player.matches} matches played on ${environment.WEBSITE_NAME}`}
      canonical={`/players/${steamId}`}
      embedStyle={resolve(import.meta.dirname, 'style.css')}
    >
      <NavigationBar />
      <Page>
        <div class="relative container mx-auto flex flex-col gap-[30px]">
          <PlayerPresentation player={player} name={name} avatar={summary?.avatar.large} />

          {isMe && gc.adminEnabled() && <PlayerAccount steamId={steamId} />}
          {isAdmin && gc.adminEnabled() && <AdminToolbox steamId={steamId} />}

          <div id="gameList" class="contents">
            <PlayerGameList steamId={steamId} page={props.page} />
          </div>
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}

export async function PlayerGameList(props: { steamId: SteamId64; page: number }) {
  const result = await gc.matches({
    steamId: props.steamId,
    offset: (props.page - 1) * gamesPerPage,
    limit: gamesPerPage,
  })
  const games = result.matches ?? []
  const { last, around } = paginate(props.page, gamesPerPage, result.total)

  return games.length > 0 ? (
    <>
      <div class="text-abru-light-75 text-center text-2xl font-bold md:text-start">
        Game history
      </div>
      <div class="game-list col-span-2" style="view-transition-name: player-game-list">
        {games.map(game => (
          <GameListItem
            game={game}
            classPlayed={
              classesPlayed(
                game.result?.players?.find(p => p.steam_id === props.steamId)?.classes_played,
              )[0]
            }
          />
        ))}
      </div>

      <Pagination
        hrefFn={page => `/players/${props.steamId}?gamespage=${page}`}
        lastPage={last}
        currentPage={props.page}
        around={around}
        hxTarget="#gameList"
      />
    </>
  ) : (
    <div></div>
  )
}

function PlayerPresentation(props: { player: GcPlayer; name: string; avatar: string | undefined }) {
  const { player } = props
  const roles = rolesOf(player.steam_id as SteamId64)
  const levelProgress =
    player.level_xp_total > 0 ? Math.round((player.level_xp / player.level_xp_total) * 100) : 0
  return (
    <div class="player-presentation">
      <img
        src={playerAvatarUrl(props.avatar ? { large: props.avatar } : undefined, 'large')}
        width="184"
        height="184"
        class="player-avatar"
        alt={`${props.name}'s avatar`}
        fetchpriority="high"
      />

      <div class="flex flex-row flex-wrap items-center gap-[10px]">
        {player.clan && (
          <a
            href={`/players?q=${encodeURIComponent(player.clan.tag)}`}
            class="text-[32px] leading-none font-bold"
            style={player.clan.color ? `color: ${player.clan.color}` : undefined}
            title={player.clan.name}
            safe
          >
            [{player.clan.tag}]
          </a>
        )}
        <span class="-mt-[6px] text-[48px] leading-none font-bold" safe>
          {props.name}
        </span>
        {roles.includes(PlayerRole.admin) ? (
          <span class="bg-alert text-abru-light-3 rounded-[3px] px-[8px] py-[6px] leading-none font-bold">
            admin
          </span>
        ) : (
          <></>
        )}
        {player.war_side && (
          <span
            class={[
              'rounded-[3px] px-[8px] py-[6px] leading-none font-bold text-white uppercase',
              player.war_side === 'blu' ? 'bg-team-blu' : 'bg-team-red',
            ]}
            safe
          >
            {player.war_side}
          </span>
        )}
      </div>

      <div class="flex-col md:justify-self-end">
        <div class="text-center text-base font-light md:text-start">Last match:</div>
        <div class="text-2xl font-bold" safe>
          {player.last_match ? format(player.last_match, 'MMMM dd, yyyy') : 'never'}
        </div>
      </div>

      <div class="player-stats">
        <span class="md:hidden">
          <IconSum size={32} />
        </span>
        <span class="hidden text-base font-light md:inline">Matches:</span>
        <span class="justify-self-start text-2xl font-bold">{player.matches}</span>

        <div class="bg-abru-light-15 row-span-2 mx-2 hidden h-[48px] w-[2px] self-center md:block"></div>

        <IconCheck size={32} class="text-game-result-win" />
        <span class="text-2xl font-bold">{player.wins}</span>
        <IconX size={32} class="text-game-result-loss" />
        <span class="text-2xl font-bold">{player.losses}</span>

        <div class="bg-abru-light-15 row-span-2 mx-2 hidden h-[48px] w-[2px] self-center md:block"></div>

        <IconCrown size={32} />
        <span class="text-2xl font-bold" title={`${player.level_xp}/${player.level_xp_total} XP`}>
          {player.level}
        </span>
        <IconAwardFilled size={32} />
        <span class="text-2xl font-bold" title={`${levelProgress}% to the next level`}>
          {player.xp}
        </span>
      </div>

      <div class="grid gap-[10px] md:grid-flow-col md:grid-rows-1 md:justify-items-center md:max-xl:col-span-3 lg:place-content-end">
        <a
          href={`https://steamcommunity.com/profiles/${player.steam_id}`}
          target="_blank"
          rel="noreferrer"
          class="player-presentation-link"
          title="Steam"
        >
          <IconBrandSteam />
          <span>steam</span>
        </a>

        <a href="/hall-of-fame" class="player-presentation-link" title="Hall of fame">
          <IconStars />
          <span>{`level ${player.level}`}</span>
        </a>
      </div>
    </div>
  )
}
