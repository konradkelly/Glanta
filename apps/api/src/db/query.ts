import type { Pool } from 'pg'
import type { AgentRun, RunStatus, TraceStep } from '../types/telemetry.js'

const RUN_COLUMNS = `
  run_id, agent_name, status, started_at, completed_at,
  input, output, error,
  token_input, token_output, token_total,
  latency_ms, metadata
`

const STEP_COLUMNS = `
  step_id, run_id, step_name, status, started_at, completed_at,
  input, output, error,
  token_input, token_output, token_total,
  latency_ms, model, metadata
`

type RunRow = {
  run_id: string
  agent_name: string
  status: string
  started_at: Date
  completed_at: Date | null
  input: string
  output: string | null
  error: string | null
  token_input: number | null
  token_output: number | null
  token_total: number | null
  latency_ms: number | null
  metadata: Record<string, unknown> | null
}

type StepRow = {
  step_id: string
  run_id: string
  step_name: string
  status: string
  started_at: Date
  completed_at: Date | null
  input: string
  output: string | null
  error: string | null
  token_input: number | null
  token_output: number | null
  token_total: number | null
  latency_ms: number | null
  model: string | null
  metadata: Record<string, unknown> | null
}

function toIsoString(value: Date | null): string | undefined {
  return value?.toISOString()
}

function toAgentRun(row: RunRow): AgentRun {
  const run: AgentRun = {
    runId: row.run_id,
    agentName: row.agent_name,
    status: row.status as RunStatus,
    startedAt: row.started_at.toISOString(),
    input: row.input,
  }

  const completedAt = toIsoString(row.completed_at)
  if (completedAt !== undefined) run.completedAt = completedAt
  if (row.output !== null) run.output = row.output
  if (row.error !== null) run.error = row.error
  if (row.token_input !== null) run.tokenInput = row.token_input
  if (row.token_output !== null) run.tokenOutput = row.token_output
  if (row.token_total !== null) run.tokenTotal = row.token_total
  if (row.latency_ms !== null) run.latencyMs = row.latency_ms
  if (row.metadata !== null) run.metadata = row.metadata

  return run
}

function toTraceStep(row: StepRow): TraceStep {
  const step: TraceStep = {
    stepId: row.step_id,
    runId: row.run_id,
    stepName: row.step_name,
    status: row.status as RunStatus,
    startedAt: row.started_at.toISOString(),
    input: row.input,
  }

  const completedAt = toIsoString(row.completed_at)
  if (completedAt !== undefined) step.completedAt = completedAt
  if (row.output !== null) step.output = row.output
  if (row.error !== null) step.error = row.error
  if (row.token_input !== null) step.tokenInput = row.token_input
  if (row.token_output !== null) step.tokenOutput = row.token_output
  if (row.token_total !== null) step.tokenTotal = row.token_total
  if (row.latency_ms !== null) step.latencyMs = row.latency_ms
  if (row.model !== null) step.model = row.model
  if (row.metadata !== null) step.metadata = row.metadata

  return step
}

export async function listRuns(
  pool: Pool,
  options: { limit: number; status?: RunStatus },
): Promise<AgentRun[]> {
  const { rows } = await pool.query<RunRow>(
    `SELECT ${RUN_COLUMNS}
     FROM runs
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY started_at DESC
     LIMIT $2`,
    [options.status ?? null, options.limit],
  )

  return rows.map(toAgentRun)
}

export async function getRunWithSteps(
  pool: Pool,
  runId: string,
): Promise<{ run: AgentRun; steps: TraceStep[] } | null> {
  const runResult = await pool.query<RunRow>(
    `SELECT ${RUN_COLUMNS} FROM runs WHERE run_id = $1`,
    [runId],
  )

  if (runResult.rows.length === 0) {
    return null
  }

  const stepsResult = await pool.query<StepRow>(
    `SELECT ${STEP_COLUMNS}
     FROM steps
     WHERE run_id = $1
     ORDER BY started_at ASC`,
    [runId],
  )

  return {
    run: toAgentRun(runResult.rows[0]!),
    steps: stepsResult.rows.map(toTraceStep),
  }
}
