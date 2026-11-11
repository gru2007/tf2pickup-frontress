import { requestContext } from '@fastify/request-context'
import { PlayerRole } from '../../auth/player-role'
import { environment } from '../../environment'
import { version as safeVersion } from '../../version'

const currentYear = new Date().getFullYear()

export function Footer() {
  const user = requestContext.get('user')
  return (
    <footer class="w-full">
      <div class="container mx-auto my-4">
        <div class="text-abru-light-75 flex flex-col items-center gap-2 text-sm font-normal md:flex-row md:gap-0">
          <span>
            © {currentYear} <span safe>{environment.WEBSITE_NAME}</span> | version {safeVersion} |
            built on{' '}
            <a href="https://github.com/tf2pickup-org/tf2pickup" target="_blank">
              tf2pickup.org
            </a>
          </span>
          <div class="grow" />
          <div class="flex flex-col items-center gap-2 md:flex-row md:gap-5">
            <a href="/staff">Staff</a>
            <a href="/privacy-policy">Privacy policy</a>
            {user?.player.roles.includes(PlayerRole.admin) && <a href="/admin">Admin panel</a>}
          </div>
        </div>
      </div>
    </footer>
  )
}
