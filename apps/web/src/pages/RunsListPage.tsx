import { EmptyState } from '../components/EmptyState'
import { RunsTable } from '../components/RunsTable'
import { useRuns } from '../hooks/useRuns'

export function RunsListPage() {
  const { runs, loading, error } = useRuns(50)

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

  return <RunsTable runs={runs} />
}
