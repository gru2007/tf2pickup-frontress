import type { Children } from '@kitajs/html'
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminPanelLink,
  AdminPanelSection,
  AdminPanelSidebar,
} from '../../../html/components/admin-panel'
import {
  IconAdjustments,
  IconAdjustmentsStar,
  IconAlertSquareRounded,
  IconHeart,
  IconLogs,
  IconMapPinCog,
  IconMoodNerd,
  IconServer,
  IconUserExclamation,
} from '../../../html/components/icons'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Layout } from '../../../html/layout'
import { Footer } from '../../../html/components/footer'
import { resolve } from 'path'
import { makeTitle } from '../../../html/make-title'
import { PlayerRole } from '../../../auth/player-role'
import { requestContext } from '@fastify/request-context'

const adminPages = {
  'game-servers': {
    title: 'Game servers',
    icon: IconServer,
    section: 'Coordinator',
  },
  games: {
    title: 'Games',
    icon: IconAdjustments,
    section: 'Coordinator',
  },
  'map-pool': {
    title: 'Map pool',
    icon: IconMapPinCog,
    section: 'Coordinator',
  },
  miscellaneous: {
    title: 'Miscellaneous',
    icon: IconAdjustmentsStar,
    section: 'Coordinator',
  },
  'view-for-nerds': {
    title: 'View for nerds',
    icon: IconMoodNerd,
    section: 'Coordinator',
  },
  reports: {
    title: 'Player reports',
    icon: IconAlertSquareRounded,
    section: 'Moderation',
  },
  'player-restrictions': {
    title: 'Player restrictions',
    icon: IconUserExclamation,
    section: 'Moderation',
  },
  logs: {
    title: 'Logs',
    icon: IconLogs,
    section: 'Moderation',
  },
} as const

const superUserPages = {
  payments: {
    title: 'Payments',
    icon: IconHeart,
    section: 'Super-user',
  },
} as const

const sections = Array.from(new Set(Object.values(adminPages).map(({ section }) => section)))

export function Admin(props: {
  activePage: keyof typeof adminPages | keyof typeof superUserPages
  children: Children
}) {
  const user = requestContext.get('user')
  const title =
    props.activePage in adminPages
      ? adminPages[props.activePage as keyof typeof adminPages].title
      : superUserPages[props.activePage as keyof typeof superUserPages].title
  return (
    <Layout title={makeTitle(title)} embedStyle={resolve(import.meta.dirname, 'style.css')}>
      <NavigationBar />
      <Page>
        <AdminPanel>
          <AdminPanelSidebar>
            {sections.map(section => (
              <>
                <AdminPanelSection>{section}</AdminPanelSection>
                {Object.entries(adminPages)
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  .filter(([_, value]) => value.section === section)
                  .map(([key, value]) => (
                    <AdminPanelLink href={`/admin/${key}`} active={props.activePage === key}>
                      {value.icon({})}
                      {value.title}
                    </AdminPanelLink>
                  ))}
              </>
            ))}
            {user?.player.roles.includes(PlayerRole.superUser) && (
              <>
                <AdminPanelSection>Super-user</AdminPanelSection>
                {Object.entries(superUserPages).map(([key, value]) => (
                  <AdminPanelLink href={`/admin/${key}`} active={props.activePage === key}>
                    {value.icon({})}
                    {value.title}
                  </AdminPanelLink>
                ))}
              </>
            )}
          </AdminPanelSidebar>

          <AdminPanelBody>
            <AdminPanelHeader>{title}</AdminPanelHeader>
            {props.children}
          </AdminPanelBody>
        </AdminPanel>
      </Page>
      <Footer />
    </Layout>
  )
}
