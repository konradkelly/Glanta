import { randomUUID } from 'node:crypto'
import type { GlantaClient } from './client.js'
import type { TraceStep } from './types/telemetry.js'

export interface RunContext {
  readonly runId: string
  trackTokens(input: number, output: number): void
}

export interface StepFnResult {
  output: string
  tokenInput?: number
  tokenOutput?: number
  latencyMs?: number
  metadata?: Record<string, unknown>
}

export interface WithRunParams {
  agentName: string
  input: string
  metadata?: Record<string, unknown>
}

export interface WithRunResult {
  output?: string
}

export interface RunStepParams {
  stepName: string
  input: string
  model?: string
  metadata?: Record<string, unknown>
}

export interface RunStepResult {
  output: string
  tokenInput: number
  tokenOutput: number
}

export async function withRun<T extends WithRunResult>(
  client: GlantaClient,
  params: WithRunParams,
  fn: (ctx: RunContext) => Promise<T>,
): Promise<T & { runId: string }> {
  const runId = randomUUID()
  const startedAt = new Date().toISOString()
  let tokenInput = 0
  let tokenOutput = 0

  const ctx: RunContext = {
    runId,
    trackTokens(input, output) {
      tokenInput += input
      tokenOutput += output
    },
  }

  await client.emitRun({
    runId,
    agentName: params.agentName,
    status: 'running',
    startedAt,
    input: params.input,
    ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
  })

  try {
    const result = await fn(ctx)
    await client.emitRun({
      runId,
      agentName: params.agentName,
      status: 'success',
      startedAt,
      completedAt: new Date().toISOString(),
      input: params.input,
      output: result.output,
      tokenInput,
      tokenOutput,
      tokenTotal: tokenInput + tokenOutput,
      latencyMs: Date.now() - new Date(startedAt).getTime(),
      ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
    })
    return { ...result, runId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await client.emitRun({
      runId,
      agentName: params.agentName,
      status: 'error',
      startedAt,
      completedAt: new Date().toISOString(),
      input: params.input,
      error,
      tokenInput: tokenInput || undefined,
      tokenOutput: tokenOutput || undefined,
      tokenTotal: tokenInput + tokenOutput || undefined,
      latencyMs: Date.now() - new Date(startedAt).getTime(),
      ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
    })
    throw err
  }
}

export async function runStep(
  client: GlantaClient,
  ctx: RunContext,
  params: RunStepParams,
  fn: () => Promise<StepFnResult>,
): Promise<RunStepResult> {
  const stepId = randomUUID()
  const startedAt = new Date().toISOString()

  const runningStep: TraceStep = {
    stepId,
    runId: ctx.runId,
    stepName: params.stepName,
    status: 'running',
    startedAt,
    input: params.input,
    ...(params.model !== undefined ? { model: params.model } : {}),
    ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
  }
  await client.emitStep(runningStep)

  try {
    const result = await fn()
    const tokenInput = result.tokenInput ?? 0
    const tokenOutput = result.tokenOutput ?? 0

    await client.emitStep({
      ...runningStep,
      status: 'success',
      completedAt: new Date().toISOString(),
      output: result.output,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
      tokenTotal: tokenInput + tokenOutput,
      latencyMs: result.latencyMs,
      ...(result.metadata !== undefined ? { metadata: result.metadata } : {}),
    })

    ctx.trackTokens(tokenInput, tokenOutput)

    return {
      output: result.output,
      tokenInput,
      tokenOutput,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await client.emitStep({
      ...runningStep,
      status: 'error',
      completedAt: new Date().toISOString(),
      error,
    })
    throw err
  }
}
