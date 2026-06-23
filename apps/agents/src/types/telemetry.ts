export type RunStatus = 'running' | 'success' | 'error'

export interface AgentRun {
  runId: string
  agentName: string
  status: RunStatus
  startedAt: string
  completedAt?: string
  input: string
  output?: string
  error?: string
  tokenInput?: number
  tokenOutput?: number
  tokenTotal?: number
  latencyMs?: number
  metadata?: Record<string, unknown>
}

export interface TraceStep {
  stepId: string
  runId: string
  stepName: string
  status: RunStatus
  startedAt: string
  completedAt?: string
  input: string
  output?: string
  error?: string
  tokenInput?: number
  tokenOutput?: number
  tokenTotal?: number
  latencyMs?: number
  model?: string
  metadata?: Record<string, unknown>
}
