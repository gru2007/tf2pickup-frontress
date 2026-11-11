/* eslint-disable @typescript-eslint/no-base-to-string */
import { environment } from '../environment'
import Html from '@kitajs/html'
import { resolve } from 'path'
import { requestContext } from '@fastify/request-context'
import { embed } from './embed'
import { bundle } from './bundle'
import { mainTsPath } from './main-ts-path'
import { FlashMessageList } from './components/flash-message'

export async function Layout(
  props?: Html.PropsWithChildren<{
    title?: string | undefined
    description?: string | undefined
    canonical?: string | undefined
    image?: string | undefined
    embedStyle?: string | undefined
  }>,
) {
  const title = <title safe>{props?.title ?? environment.WEBSITE_NAME}</title>
  const safeStyle = props?.embedStyle ? embed(props.embedStyle) : undefined
  const body = (
    <>
      {safeStyle ? <style type="text/css">{safeStyle}</style> : <></>}
      <div class="flex h-full flex-col">{props?.children}</div>
      <FlashMessageList />
    </>
  )

  // if we're coming from boosted request, render only the fragment
  if (requestContext.get('boosted')) {
    return (
      <>
        {body}
        {title}
      </>
    )
  }

  const safeCss = await embed(resolve(import.meta.dirname, 'styles', 'main.css'))
  const bundleUrl = await bundle(mainTsPath)

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="htmx-config" content='{"historyCacheSize":"0","globalViewTransitions":true}' />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://avatars.steamstatic.com" />
        <link
          rel="preload"
          href="/fonts/Satoshi-Variable.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <script src={bundleUrl} type="module"></script>
        <style type="text/css">{safeCss}</style>
        {title}
        <MetaTags {...props} />
      </head>
      <body
        hx-ext="head-support,remove-me,preload,copy-to-clipboard,sync-attribute,countdown"
        class="h-screen"
        hx-boost="true"
      >
        {body}
      </body>
    </html>
  )
}

function MetaTags(props?: {
  title?: string | undefined
  description?: string | undefined
  canonical?: string | undefined
  image?: string | undefined
}) {
  const safeMetaTags: JSX.Element[] = []
  const safeOgTags: JSX.Element[] = []

  const title = props?.title ?? environment.WEBSITE_NAME
  const image = `${environment.WEBSITE_URL}${props?.image ?? '/og-image.png'}`

  safeOgTags.push(
    <meta property="og:type" content="website" />,
    <meta property="og:site_name" content={environment.WEBSITE_NAME} />,
    <meta property="og:title" content={title} />,
    <meta property="og:image" content={image} />,
    <meta property="og:image:width" content="1200" />,
    <meta property="og:image:height" content="630" />,
  )
  safeMetaTags.push(
    <meta name="twitter:card" content="summary_large_image" />,
    <meta name="twitter:title" content={title} />,
    <meta name="twitter:image" content={image} />,
  )

  if (props?.description) {
    safeMetaTags.push(
      <meta name="description" content={props.description} />,
      <meta name="twitter:description" content={props.description} />,
    )
    safeOgTags.push(<meta property="og:description" content={props.description} />)
  }

  if (props?.canonical) {
    safeMetaTags.push(
      <link rel="canonical" href={`${environment.WEBSITE_URL}${props.canonical}`} />,
    )
    safeOgTags.push(
      <meta property="og:url" content={`${environment.WEBSITE_URL}${props.canonical}`} />,
    )
  }

  return (
    <>
      {safeMetaTags.join('\n')}
      {safeOgTags.join('\n')}
    </>
  )
}
