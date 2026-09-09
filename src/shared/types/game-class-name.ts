import type { Tf2ClassName } from './tf2-class-name'

export const frontressGameClass = 'frontress' as const

export type GameClassName = Tf2ClassName | typeof frontressGameClass
