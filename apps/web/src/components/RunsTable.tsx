import type { AgentRun } from '../types/telemetry'
import { StatusBadge } from './StatusBadge'

type RunsTableProps = {
  runs: AgentRun[]
}

function formatStartedAt(iso: string): string {
  return new Date(iso).toLocaleString()
}

function formatOptional(value: number | undefined): string {
  return value === undefined ? '—' : String(value)
}

export function RunsTable({ runs }: RunsTableProps) {
  return (
    <div className="runs-table-wrap">
      <table className="runs-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Agent</th>
            <th>Status</th>
            <th>Started</th>
            <th>Latency (ms)</th>
            <th>Tokens</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.runId}>
              <td className="runs-table__mono">{run.runId}</td>
              <td>{run.agentName}</td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>{formatStartedAt(run.startedAt)}</td>
              <td className="runs-table__num">{formatOptional(run.latencyMs)}</td>
              <td className="runs-table__num">{formatOptional(run.tokenTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
