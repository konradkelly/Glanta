import { Link, useParams } from 'react-router-dom'
import { RefreshIndicator } from '../components/RefreshIndicator'
import { RunSummary } from '../components/RunSummary'
import { StepsTimeline } from '../components/StepsTimeline'
import { useRun } from '../hooks/useRun'

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>()
  const { data, loading, error, notFound, lastUpdated } = useRun(runId ?? '')

  if (!runId) {
    return <p className="state-message state-message--error">Missing run ID.</p>
  }

  if (loading) {
    return <p className="state-message">Loading run…</p>
  }

  if (notFound) {
    return (
      <>
        <Link to="/" className="back-link">
          ← Back to runs
        </Link>
        <p className="state-message state-message--error">Run not found.</p>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <Link to="/" className="back-link">
          ← Back to runs
        </Link>
        <p className="state-message state-message--error">
          Could not load run — start the API and Postgres, then refresh.
        </p>
      </>
    )
  }

  return (
    <div className="run-detail">
      <div className="run-detail__toolbar">
        <Link to="/" className="back-link">
          ← Back to runs
        </Link>
        <RefreshIndicator updatedAt={lastUpdated} />
      </div>
      <RunSummary run={data.run} />
      <StepsTimeline steps={data.steps} />
    </div>
  )
}
