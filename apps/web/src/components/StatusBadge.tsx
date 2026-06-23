import type { RunStatus } from '../types/telemetry'

const LABELS: Record<RunStatus, string> = {
  running: 'Running',
  success: 'Success',
  error: 'Error',
}

type StatusBadgeProps = {
  status: RunStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{LABELS[status]}</span>
}
