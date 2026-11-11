// The coordinator sends "" for a name it does not know.
export function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  return values.find(value => value !== undefined && value !== '')
}
