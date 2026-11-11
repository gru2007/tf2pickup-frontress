import { requestContext } from '@fastify/request-context'
import { GamesLink } from './games-link'
import { IconBrandDiscord, IconCrown, IconDownload, IconLogout, IconMenu2, IconX } from './icons'
import { IconBrandSteam } from './icons/icon-brand-steam'
import { Profile } from './profile'
import Html from '@kitajs/html'
import { environment } from '../../environment'
import { playerAvatarUrl } from '../../shared/player-avatar-url'

export function NavigationBar() {
  const user = requestContext.get('user')
  return (
    <nav class="relative flex min-h-[64px] flex-row justify-center lg:min-h-[95px]">
      <div class="container flex flex-row items-center px-2 lg:px-0">
        <button
          class="text-abru-light-75 p-3 lg:hidden"
          id="toggle-nav-menu"
          aria-label="Toggle menu"
          aria-controls="nav-menu"
          aria-expanded="false"
        >
          <span id="nav-menu-icon-open">
            <IconMenu2 size={28} />
          </span>
          <span id="nav-menu-icon-close" class="hidden">
            <IconX size={28} />
          </span>
        </button>

        <a href="/" class="self-center lg:mx-1">
          <img
            alt={`${environment.WEBSITE_NAME} logo`}
            src="/logo.png"
            height="120"
            class="h-[32px] lg:h-[44px]"
          />
        </a>

        <div
          id="nav-menu"
          class="max-lg:bg-abru hidden flex-row items-center gap-5 font-medium max-lg:fixed max-lg:inset-x-0 max-lg:top-16 max-lg:bottom-0 max-lg:z-40 max-lg:flex-col max-lg:items-stretch max-lg:overflow-y-auto max-lg:py-4 lg:ml-auto lg:flex"
        >
          <Menu />
        </div>

        <div class="ml-auto lg:ml-3">
          {user ? (
            <>
              <a
                href={`/players/${user.player.steamId}`}
                class="block p-1 lg:hidden"
                aria-label="My profile"
                preload="mousedown"
              >
                <img
                  src={playerAvatarUrl(user.player.avatar, 'medium')}
                  width="64"
                  class="h-[36px] w-[36px] rounded-[3px]"
                  alt={`${user.player.name}'s avatar`}
                />
              </a>
              <div class="max-lg:hidden">
                <Profile {...user.player} />
              </div>
            </>
          ) : (
            <SteamButton />
          )}
        </div>
      </div>
      <script>{`
        {
          const menu = document.getElementById('nav-menu');
          const button = document.getElementById('toggle-nav-menu');
          const openIcon = document.getElementById('nav-menu-icon-open');
          const closeIcon = document.getElementById('nav-menu-icon-close');
          const nav = button.closest('nav');
          button.addEventListener('click', () => {
            const open = menu.style.display === 'flex';
            menu.style.display = open ? '' : 'flex';
            button.setAttribute('aria-expanded', String(!open));
            openIcon.classList.toggle('hidden', !open);
            closeIcon.classList.toggle('hidden', open);
            nav.classList.toggle('max-lg:bg-abru', !open);
          });
        }
      `}</script>
    </nav>
  )
}

function Menu() {
  const user = requestContext.get('user')
  const discordInvite = environment.DISCORD_INVITE_URL

  return (
    <div class="flex flex-col gap-[10px] px-4 lg:flex-row lg:items-center lg:px-0">
      <GamesLink />
      <MenuItem href="/players">Players</MenuItem>
      <MenuItem href="/rules">Rules</MenuItem>

      <MenuItem href="/hall-of-fame">
        <IconCrown />
        HOF
      </MenuItem>

      <div class="hidden w-8 xl:block" />
      <div class="bg-abru-light-10 my-2 h-px lg:hidden" />

      <div class="flex flex-row items-center gap-7 p-3 lg:contents">
        {discordInvite !== undefined && (
          <a
            href={discordInvite}
            class="text-abru-light-75 hover:text-slate-200 lg:hidden xl:inline-block"
            target="_blank"
          >
            <IconBrandDiscord size={32} class="max-lg:h-6 max-lg:w-6" />
            <span class="tooltip whitespace-nowrap" data-placement="bottom">
              Join us on Discord!
            </span>
          </a>
        )}

        {environment.DOWNLOAD_URL !== undefined && (
          <a
            href={environment.DOWNLOAD_URL}
            class="text-abru-light-75 hover:text-slate-200 lg:hidden xl:inline-block"
            target="_blank"
          >
            <IconDownload size={32} class="max-lg:h-6 max-lg:w-6" />
            <span class="tooltip whitespace-nowrap" data-placement="bottom">
              Get the game
            </span>
          </a>
        )}

        {!!user && (
          <>
            <a
              href="/auth/sign-out"
              class="text-accent-600 lg:hidden"
              aria-label="Sign out"
              hx-boost="false"
            >
              <IconLogout size={24} />
            </a>
          </>
        )}
      </div>
    </div>
  )
}

function MenuItem({ href, children }: Html.PropsWithChildren<{ href: string }>) {
  const url = requestContext.get('url')
  return (
    <a
      href={href}
      class="nav-menu-item"
      aria-current={url === href ? 'page' : undefined}
      preload="mousedown"
    >
      {children}
    </a>
  )
}

function SteamButton() {
  return (
    <a href="/auth/steam" class="nav-steam-button max-lg:p-2" hx-boost="false">
      <span class="max-lg:hidden">Sign in through Steam</span>
      <div class="icon">
        <IconBrandSteam />
      </div>
    </a>
  )
}
