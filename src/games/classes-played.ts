import { Tf2ClassName } from '../shared/types/tf2-class-name'

// TF_CLASS_* indices, as the game reports them in classes_played.
const classByIndex: Record<number, Tf2ClassName> = {
  1: Tf2ClassName.scout,
  2: Tf2ClassName.sniper,
  3: Tf2ClassName.soldier,
  4: Tf2ClassName.demoman,
  5: Tf2ClassName.medic,
  6: Tf2ClassName.heavy,
  7: Tf2ClassName.pyro,
  8: Tf2ClassName.spy,
  9: Tf2ClassName.engineer,
}

export function classesPlayed(mask: number | undefined): Tf2ClassName[] {
  if (!mask) {
    return []
  }
  return Object.entries(classByIndex)
    .filter(([index]) => (mask & (1 << Number(index))) !== 0)
    .map(([, name]) => name)
}
