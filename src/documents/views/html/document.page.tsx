import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Layout } from '../../../html/layout'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import { makeTitle } from '../../../html/make-title'
import { parseMarkdown } from '../../../utils/parse-markdown'

// Rules and the privacy policy are files shipped with the site
// (src/documents/default); edit them in the repository.
export async function DocumentPage(props: { name: 'rules' | 'privacy-policy'; title: string }) {
  const markdown = await readFile(
    resolve(import.meta.dirname, '..', '..', 'default', `${props.name}.md`),
    'utf-8',
  )
  const safeParsed = await parseMarkdown(markdown)

  return (
    <Layout title={makeTitle(props.title)}>
      <NavigationBar />
      <Page>
        <div class="container mx-auto">
          <div class="text-abru-light-75 my-9 text-[48px] font-bold capitalize" safe>
            {props.title}
          </div>
          <article class="prose prose-invert mb-16 max-w-none">{safeParsed}</article>
        </div>
      </Page>
      <Footer />
    </Layout>
  )
}
