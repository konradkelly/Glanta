import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../utils/time'

export function useRelativeTime(timestamp: Date | null): string {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!timestamp) return

    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [timestamp])

  if (!timestamp) return ''
  return formatRelativeTime(timestamp)
}
