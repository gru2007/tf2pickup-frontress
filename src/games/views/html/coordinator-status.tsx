import { gc } from '../../../gc'

// What the game's main menu shows, in the banner the queue page used for
// announcements: people online, queues, matches and free servers.
export async function CoordinatorStatus() {
  const status = await gc.status().catch(() => null)
  if (!status) {
    return (
      <div class="banner mt-4" data-tone="alert">
        The game coordinator is unavailable right now. Matches already running are not affected.
      </div>
    )
  }

  const queues = (status.groups ?? [])
    .map(group => `${group.name}: ${group.queued}/${group.need}`)
    .join(' · ')
  return (
    <div class="banner mt-4 gap-x-6 gap-y-1" data-tone="info">
      <span>
        <strong>{status.online}</strong> online
      </span>
      <span>
        <strong>{status.in_queue}</strong> searching
      </span>
      <span>
        <strong>{status.live_matches}</strong> live
      </span>
      <span>
        <strong>{status.free_servers}</strong>/{status.servers} servers free
      </span>
      {queues && (
        <span class="md:ml-auto" safe>
          {queues}
        </span>
      )}
    </div>
  )
}
