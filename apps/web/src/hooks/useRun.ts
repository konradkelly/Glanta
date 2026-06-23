import { useEffect, useState } from 'react'
import { getRun, type RunDetailResponse } from '../api/runs'

export function useRun(runId: string) {
  const [data, setData] = useState<RunDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)

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
      } catch {
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [runId])

  return { data, loading, error, notFound }
}
