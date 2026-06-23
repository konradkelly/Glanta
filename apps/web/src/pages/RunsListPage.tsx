import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { RefreshIndicator } from '../components/RefreshIndicator'
import { RunsTable } from '../components/RunsTable'
import { StatusFilter, type StatusFilterValue } from '../components/StatusFilter'
import { useRuns } from '../hooks/useRuns'

export function RunsListPage() {
  const { runs, loading, error, lastUpdated } = useRuns(50)
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')

  const filteredRuns = useMemo(() => {
    if (statusFilter === 'all') return runs
    return runs.filter((run) => run.status === statusFilter)
  }, [runs, statusFilter])

  if (loading) {
    return <p className="state-message">Loading runs…</p>
  }

  if (error) {
    return (
      <p className="state-message state-message--error">
        Could not load runs — start the API and Postgres, then refresh.
      </p>
    )
  }

  if (runs.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="runs-list">
      <div className="runs-toolbar">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <RefreshIndicator updatedAt={lastUpdated} />
      </div>

      {filteredRuns.length === 0 ? (
        <p className="state-message">No runs match this filter.</p>
      ) : (
        <RunsTable runs={filteredRuns} />
      )}
    </div>
  )
}
