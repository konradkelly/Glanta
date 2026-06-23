import { useRelativeTime } from '../hooks/useRelativeTime'

type RefreshIndicatorProps = {
  updatedAt: Date | null
}

export function RefreshIndicator({ updatedAt }: RefreshIndicatorProps) {
  const relative = useRelativeTime(updatedAt)

  if (!updatedAt) return null

  return (
    <span className="refresh-indicator" aria-live="polite">
      <span className="refresh-indicator__dot" aria-hidden />
      Updated {relative}
    </span>
  )
}
