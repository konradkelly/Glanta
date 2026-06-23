export function formatStartedAt(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function formatOptional(value: number | undefined): string {
  return value === undefined ? '—' : String(value)
}
