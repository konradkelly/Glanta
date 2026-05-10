export type RunStatus = 'running' | 'success' | 'error'

export type EventType = 'run.started' | 'run.completed' | 'run.failed' | 'step.started' | 'step.completed' | 'step.failed'

export interface TokenUsage {
    input: number
    output: number
    total: number
  }

export interface AgentRun {
    runId: string
    agentName: string
    status: RunStatus
    startedAt: string // ISO 8601
    completedAt?: string
    input: string
    output: string
    error?: string
    tokenUsage?: TokenUsage
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
    tokenUsage?: TokenUsage
    latencyMs?: number
    model?: string
    metadata?: Record<string, unknown>
}

export interface TelemetryEvent {
    eventId: string
    eventType: EventType
    occurredAt: string
    payload: AgentRun | TraceStep
}