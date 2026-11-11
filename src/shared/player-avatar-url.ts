import { defaultPlayerAvatar } from './default-player-avatar'

export function playerAvatarUrl(
  avatar: Partial<typeof defaultPlayerAvatar> | undefined,
  size: keyof typeof defaultPlayerAvatar,
): string {
  return avatar?.[size] ?? defaultPlayerAvatar[size]
}
