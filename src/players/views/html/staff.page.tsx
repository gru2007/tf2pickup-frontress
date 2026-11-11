import { resolve } from 'node:path'
import { environment } from '../../../environment'
import { Footer } from '../../../html/components/footer'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Layout } from '../../../html/layout'
import { makeTitle } from '../../../html/make-title'
import { playerAvatarUrl } from '../../../shared/player-avatar-url'
import { PlayerRole } from '../../../auth/player-role'
import { rolesOf } from '../../../auth/roles-of'
import { gc } from '../../../gc'
import { getPlayerSummaries } from '../../../steam/get-player-summaries'
import type { SteamId64 } from '../../../shared/types/steam-id-64'
import { firstNonEmpty } from '../../../utils/first-non-empty'

interface StaffMember {
  steamId: SteamId64
  name: string
  avatar: { large: string } | undefined
  roles: PlayerRole[]
  matches: number
}

export async function StaffPage() {
  const ids = [...new Set([...environment.SUPER_USERS, ...environment.ADMINS])] as SteamId64[]
  const summaries = await getPlayerSummaries(ids)
  const staff: StaffMember[] = await Promise.all(
    ids.map(async steamId => {
      const record = await gc.player(steamId).catch(() => null)
      return {
        steamId,
        name: firstNonEmpty(summaries.get(steamId)?.name, record?.name) ?? steamId,
        avatar: summaries.get(steamId)?.avatar,
        roles: rolesOf(steamId),
        matches: record?.matches ?? 0,
      }
    }),
  )

  return (
    <Layout
      title={makeTitle('staff')}
      description={`the people who keep ${environment.WEBSITE_NAME} running`}
      canonical="/staff"
      embedStyle={resolve(import.meta.dirname, 'staff.page.css')}
    >
      <NavigationBar />
      <Page>
        <div class="container mx-auto">
          <div class="my-9">
            <div class="text-abru-light-75 text-[48px] font-bold">Staff</div>
            <div class="text-abru-light-60 text-lg">
              The people who keep <span safe>{environment.WEBSITE_NAME}</span> running
            </div>
          </div>

          <div class="staff-list">
            {staff.map(member => (
              <StaffCard member={member} />
            ))}
          </div>
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}

function StaffCard(props: { member: StaffMember }) {
  const { member } = props
  const isSuperUser = member.roles.includes(PlayerRole.superUser)
  return (
    <a
      class={['staff-card', isSuperUser ? 'staff-card--super-user' : 'staff-card--admin']}
      href={`/players/${member.steamId}`}
      preload="mousedown"
    >
      <div class="relative shrink-0 self-start">
        <img
          src={playerAvatarUrl(member.avatar, 'large')}
          width="184"
          height="184"
          class="staff-avatar"
          alt={`${member.name}'s avatar`}
        />
      </div>

      <div class="flex min-w-0 flex-col items-start gap-1">
        <span class="max-w-full truncate text-2xl font-bold" safe>
          {member.name}
        </span>
        {isSuperUser ? (
          <span class="bg-accent rounded-[3px] px-[8px] py-[6px] leading-none font-bold text-white">
            super user
          </span>
        ) : (
          <span class="bg-alert text-abru-light-3 rounded-[3px] px-[8px] py-[6px] leading-none font-bold">
            admin
          </span>
        )}
        <span class="mt-1 text-sm font-light">{member.matches} matches played</span>
      </div>
    </a>
  )
}
