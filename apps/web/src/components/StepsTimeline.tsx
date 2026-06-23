import type { TraceStep } from '../types/telemetry'
import { formatOptional, formatStartedAt } from '../utils/format'
import { StatusBadge } from './StatusBadge'
import { TextPreview } from './TextPreview'

type StepsTimelineProps = {
  steps: TraceStep[]
}

export function StepsTimeline({ steps }: StepsTimelineProps) {
  if (steps.length === 0) {
    return (
      <section className="steps-timeline">
        <h3 className="steps-timeline__heading">Trace steps</h3>
        <p className="state-message">No steps recorded for this run.</p>
      </section>
    )
  }

  return (
    <section className="steps-timeline">
      <h3 className="steps-timeline__heading">Trace steps ({steps.length})</h3>
      <ol className="steps-timeline__list">
        {steps.map((step) => (
          <li key={step.stepId} className="steps-timeline__item">
            <div className="steps-timeline__marker" aria-hidden />
            <div className="steps-timeline__card">
              <div className="steps-timeline__card-header">
                <div>
                  <h4 className="steps-timeline__step-name">{step.stepName}</h4>
                  <p className="steps-timeline__step-id">{step.stepId}</p>
                </div>
                <StatusBadge status={step.status} />
              </div>

              <dl className="steps-timeline__meta">
                <div>
                  <dt>Started</dt>
                  <dd>{formatStartedAt(step.startedAt)}</dd>
                </div>
                {step.model && (
                  <div>
                    <dt>Model</dt>
                    <dd>{step.model}</dd>
                  </div>
                )}
                <div>
                  <dt>Latency</dt>
                  <dd>{formatOptional(step.latencyMs)} ms</dd>
                </div>
                <div>
                  <dt>Tokens</dt>
                  <dd>
                    {formatOptional(step.tokenInput)} / {formatOptional(step.tokenOutput)} /{' '}
                    {formatOptional(step.tokenTotal)}
                  </dd>
                </div>
              </dl>

              <TextPreview label="Input" text={step.input} />
              {step.output && <TextPreview label="Output" text={step.output} />}
              {step.error && (
                <div className="text-preview text-preview--error">
                  <span className="text-preview__label">Error</span>
                  <pre className="text-preview__content">{step.error}</pre>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
