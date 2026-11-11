import { errors } from '../errors'

const hoursPer = { hours: 1, days: 24, weeks: 24 * 7, months: 24 * 30 } as const

// The coordinator takes a ban length in hours; 0 means until lifted.
export function banHours(form: {
  lengthSelector: 'duration' | 'forever'
  duration?: number | undefined
  durationUnits?: keyof typeof hoursPer | undefined
}): number {
  if (form.lengthSelector === 'forever') {
    return 0
  }
  if (!form.duration || !form.durationUnits) {
    throw errors.badRequest('A ban length is required')
  }
  const hours = form.duration * hoursPer[form.durationUnits]
  if (hours > 24 * 365 * 10) {
    throw errors.badRequest('A ban can last at most ten years; ban until lifted instead')
  }
  return hours
}
