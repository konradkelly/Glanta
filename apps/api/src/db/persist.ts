import type { Pool } from 'pg'
import type { AgentRun, TraceStep } from '../types/telemetry.js'

function jsonOrNull(value: Record<string, unknown> | undefined): string | null {
  if (value === undefined) return null
  return JSON.stringify(value)
}

export async function upsertRun(pool: Pool, run: AgentRun): Promise<void> {
  await pool.query(
    `INSERT INTO runs (
      run_id, agent_name, status, started_at, completed_at,
      input, output, error,
      token_input, token_output, token_total,
      latency_ms, metadata
    ) VALUES (
      $1, $2, $3, $4::timestamptz, $5::timestamptz,
      $6, $7, $8,
      $9, $10, $11,
      $12, $13::jsonb
    )
    ON CONFLICT (run_id) DO UPDATE SET
      agent_name = EXCLUDED.agent_name,
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      completed_at = EXCLUDED.completed_at,
      input = EXCLUDED.input,
      output = EXCLUDED.output,
      error = EXCLUDED.error,
      token_input = EXCLUDED.token_input,
      token_output = EXCLUDED.token_output,
      token_total = EXCLUDED.token_total,
      latency_ms = EXCLUDED.latency_ms,
      metadata = EXCLUDED.metadata,
      updated_at = now()`,
    [
      run.runId,
      run.agentName,
      run.status,
      run.startedAt,
      run.completedAt ?? null,
      run.input,
      run.output ?? null,
      run.error ?? null,
      run.tokenUsage?.input ?? null,
      run.tokenUsage?.output ?? null,
      run.tokenUsage?.total ?? null,
      run.latencyMs ?? null,
      jsonOrNull(run.metadata),
    ],
  )
}

export async function upsertStep(pool: Pool, step: TraceStep): Promise<void> {
  await pool.query(
    `INSERT INTO steps (
      step_id, run_id, step_name, status, started_at, completed_at,
      input, output, error,
      token_input, token_output, token_total,
      latency_ms, model, metadata
    ) VALUES (
      $1, $2, $3, $4, $5::timestamptz, $6::timestamptz,
      $7, $8, $9,
      $10, $11, $12,
      $13, $14, $15::jsonb
    )
    ON CONFLICT (step_id) DO UPDATE SET
      run_id = EXCLUDED.run_id,
      step_name = EXCLUDED.step_name,
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      completed_at = EXCLUDED.completed_at,
      input = EXCLUDED.input,
      output = EXCLUDED.output,
      error = EXCLUDED.error,
      token_input = EXCLUDED.token_input,
      token_output = EXCLUDED.token_output,
      token_total = EXCLUDED.token_total,
      latency_ms = EXCLUDED.latency_ms,
      model = EXCLUDED.model,
      metadata = EXCLUDED.metadata,
      updated_at = now()`,
    [
      step.stepId,
      step.runId,
      step.stepName,
      step.status,
      step.startedAt,
      step.completedAt ?? null,
      step.input,
      step.output ?? null,
      step.error ?? null,
      step.tokenUsage?.input ?? null,
      step.tokenUsage?.output ?? null,
      step.tokenUsage?.total ?? null,
      step.latencyMs ?? null,
      step.model ?? null,
      jsonOrNull(step.metadata),
    ],
  )
}