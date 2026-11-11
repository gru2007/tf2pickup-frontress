import { environment } from '../../../../environment'
import { IconCopy } from '../../../../html/components/icons'
import { Admin } from '../../../views/html/admin'

// A key that was just made. The coordinator never shows it again.
export function NewServerKeyPage(props: { name: string; serverKey: string }) {
  const safeConfig = [
    `tf_gc_server_url "${environment.GC_PUBLIC_URL ?? environment.GC_URL}"`,
    `tf_gc_server_key "${props.serverKey}"`,
    'tf_mm_servermode 1',
    'tf_mm_strict 1',
    'tf_allow_server_hibernation 0',
  ].join('\n')
  return (
    <Admin activePage="game-servers">
      <div class="admin-panel-set">
        <h4 class="pb-4" safe>
          {`Key "${props.name}"`}
        </h4>
        <div class="banner mb-4" data-tone="alert">
          Copy it now: it is not shown again. Lost keys are rotated, not recovered.
        </div>
        <p class="text-abru-light-75 mb-2 text-sm">
          Put this in the server's server.cfg (or set GC_URL and GC_SECRET in its container):
        </p>
        <div class="connect-string flex flex-row gap-4">
          <pre class="text-abru-light-85 flex-1 overflow-x-auto text-sm">{safeConfig}</pre>
          <button class="hover:text-abru-light-85 self-start" copy-to-clipboard={safeConfig}>
            <IconCopy size={24} />
            <span class="sr-only">Copy</span>
          </button>
        </div>
        <a href="/admin/game-servers" class="button mt-6 inline-flex" data-variant="accent">
          Back to the pool
        </a>
      </div>
    </Admin>
  )
}
