import htmx from './htmx.js'

// htmx does not swap error responses, so an admin action the coordinator
// refused (a missing reason, a ban it will not issue) would fail silently.
// Show the server's message as an error flash message instead.
htmx.on('htmx:responseError', event => {
  const xhr = (event as CustomEvent<{ xhr: XMLHttpRequest }>).detail.xhr
  const list = document.getElementById('flash-messages')
  if (!list) {
    return
  }

  const isText = xhr.getResponseHeader('content-type')?.startsWith('text/plain') ?? false
  const box = document.createElement('div')
  box.className = 'message error'
  box.setAttribute('data-flash-message', '')
  const content = document.createElement('div')
  content.className = 'content'
  content.textContent = isText && xhr.responseText ? xhr.responseText : `Error ${xhr.status}`
  const progress = document.createElement('progress')
  progress.max = 100
  progress.value = 100
  box.append(content, progress)
  list.append(box)
  htmx.process(box)
})
