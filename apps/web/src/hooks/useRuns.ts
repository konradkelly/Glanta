import { useEffect, useState } from 'react'
import { getRuns } from '../api/runs'
import type { AgentRun } from '../types/telemetry'

const POLL_MS = 5000

export function useRuns(limit = 50) {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load(isInitial: boolean) {
      if (isInitial) {
        setLoading(true)
      }

      try {
        const data = await getRuns(limit)
        if (!cancelled) {
          setRuns(data.runs)
          setLastUpdated(new Date())
          setError(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled && isInitial) {
          setLoading(false)
        }
      }
    }

    void load(true)
    const intervalId = setInterval(() => void load(false), POLL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [limit])

  return { runs, loading, error, lastUpdated }
}
