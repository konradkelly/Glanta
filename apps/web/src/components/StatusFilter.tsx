import type { RunStatus } from '../types/telemetry'

export type StatusFilterValue = RunStatus | 'all'

type StatusFilterProps = {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
]

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="status-filter" role="group" aria-label="Filter by status">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`status-filter__btn${value === option.value ? ' status-filter__btn--active' : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
