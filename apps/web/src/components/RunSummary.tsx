import type { AgentRun } from '../types/telemetry'
import { formatOptional, formatStartedAt } from '../utils/format'
import { StatusBadge } from './StatusBadge'
import { TextPreview } from './TextPreview'

type RunSummaryProps = {
  run: AgentRun
}

export function RunSummary({ run }: RunSummaryProps) {
  const hasMetadata = run.metadata && Object.keys(run.metadata).length > 0

  return (
    <section className="run-summary">
      <div className="run-summary__header">
        <div>
          <h2>{run.agentName}</h2>
          <p className="run-summary__run-id">{run.runId}</p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      <dl className="run-summary__stats">
        <div className="run-summary__stat">
          <dt>Started</dt>
          <dd>{formatStartedAt(run.startedAt)}</dd>
        </div>
        {run.completedAt && (
          <div className="run-summary__stat">
            <dt>Completed</dt>
            <dd>{formatStartedAt(run.completedAt)}</dd>
          </div>
        )}
        <div className="run-summary__stat">
          <dt>Latency</dt>
          <dd>{formatOptional(run.latencyMs)} ms</dd>
        </div>
        <div className="run-summary__stat">
          <dt>Tokens (in / out / total)</dt>
          <dd>
            {formatOptional(run.tokenInput)} / {formatOptional(run.tokenOutput)} /{' '}
            {formatOptional(run.tokenTotal)}
          </dd>
        </div>
      </dl>

      <TextPreview label="Input" text={run.input} />
      {run.output && <TextPreview label="Output" text={run.output} />}
      {run.error && (
        <div className="text-preview text-preview--error">
          <span className="text-preview__label">Error</span>
          <pre className="text-preview__content">{run.error}</pre>
        </div>
      )}

      {hasMetadata && (
        <details className="run-summary__metadata">
          <summary>Metadata</summary>
          <pre>{JSON.stringify(run.metadata, null, 2)}</pre>
        </details>
      )}
    </section>
  )
}
