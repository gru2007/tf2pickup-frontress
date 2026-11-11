import htmx from './htmx.js'

export async function goTo(path: string) {
  await htmx.ajax('get', path, { target: document.body, push: 'true' })
}
