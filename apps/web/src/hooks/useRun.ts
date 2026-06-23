import { useEffect, useState } from 'react'
import { getRun, type RunDetailResponse } from '../api/runs'

const POLL_MS = 5000

export function useRun(runId: string) {
  const [data, setData] = useState<RunDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!runId) return

    let cancelled = false

    async function load(isInitial: boolean) {
      if (isInitial) {
        setLoading(true)
        setNotFound(false)
      }

      try {
        const result = await getRun(runId)
        if (cancelled) return

        if (result === null) {
          setNotFound(true)
          setData(null)
          setError(false)
          return
        }

        setData(result)
        setNotFound(false)
        setError(false)
        setLastUpdated(new Date())
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
  }, [runId])

  return { data, loading, error, notFound, lastUpdated }
}
