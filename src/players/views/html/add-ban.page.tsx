import { resolve } from 'path'
import { Footer } from '../../../html/components/footer'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Layout } from '../../../html/layout'
import { makeTitle } from '../../../html/make-title'
import type { SteamId64 } from '../../../shared/types/steam-id-64'
import { gc } from '../../../gc'
import { firstNonEmpty } from '../../../utils/first-non-empty'

// A matchmaking ban: the coordinator keeps the player out of every queue.
// From the reports page it also closes the player's open reports.
export async function AddBanPage(props: { steamId: SteamId64; fromReports: boolean }) {
  const name =
    firstNonEmpty((await gc.player(props.steamId).catch(() => null))?.name) ?? props.steamId
  return (
    <Layout
      title={makeTitle(`Ban ${name}`)}
      embedStyle={resolve(
        import.meta.dirname,
        '..',
        '..',
        '..',
        'admin',
        'views',
        'html',
        'style.css',
      )}
    >
      <NavigationBar />
      <Page>
        <div class="container mx-auto">
          <form action="" method="post" id="addBanForm">
            {props.fromReports && <input type="hidden" name="reports" value="1" />}
            <div class="admin-panel-set">
              <div class="form-checkbox">
                <input
                  type="radio"
                  name="lengthSelector"
                  id="lengthSelectorDuration"
                  value="duration"
                  checked
                />
                <label for="lengthSelectorDuration">Duration</label>
              </div>

              <fieldset
                class="mb-2 ml-[22px] flex flex-row gap-2"
                data-toggle-disabled-form="#addBanForm"
                data-toggle-disabled-control="lengthSelector"
                data-toggle-disabled-value="duration"
              >
                <input type="number" name="duration" id="duration-value" value="1" min="1" />
                <select name="durationUnits">
                  <option value="hours">hours</option>
                  <option value="days" selected>
                    days
                  </option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </select>
              </fieldset>

              <div class="form-checkbox">
                <input
                  type="radio"
                  name="lengthSelector"
                  id="lengthSelectorForever"
                  value="forever"
                />
                <label for="lengthSelectorForever">Until lifted</label>
              </div>

              <div class="input-group my-4">
                <label class="form-label" for="banReason">
                  Reason
                </label>
                <input type="text" name="reason" id="banReason" maxlength="300" required />
              </div>

              <div class="form-checkbox">
                <input type="checkbox" name="steam" id="banSteam" />
                <label for="banSteam">Also issue a Steam game ban</label>
                <p class="description">
                  Only for bans until lifted, and only when Steam game bans are enabled on the
                  coordinator. A Steam game ban is public and shows on the player's Steam profile.
                </p>
              </div>
            </div>

            <button type="submit" class="button mt-6" data-variant="accent">
              Save
            </button>
          </form>
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}
