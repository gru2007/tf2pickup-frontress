// Form values as the coordinator wants them.
export const formValues = {
  number(value: unknown, fallback = 0): number {
    const n = Number(Array.isArray(value) ? value[0] : value)
    return Number.isFinite(n) ? Math.trunc(n) : fallback
  },
  checked(value: unknown): boolean {
    return value === 'on' || value === 'true' || (Array.isArray(value) && value.includes('on'))
  },
  // A textarea as typed.
  raw(value: unknown): string {
    return typeof value === 'string' ? value : ''
  },
  text(value: unknown): string {
    return String(Array.isArray(value) ? value[0] : (value ?? '')).trim()
  },
  // One value per line (or comma-separated), empty lines dropped.
  lines(value: unknown): string[] {
    return formValues
      .raw(value)
      .split(/[\n,]/)
      .map(v => v.trim())
      .filter(Boolean)
  },
  list(value: unknown): string[] {
    if (value === undefined) return []
    return (Array.isArray(value) ? value : [value]).map(String)
  },
}
