import { randomUUID } from 'node:crypto'
import { GlantaClient } from '../client.js'
import type { AgentRun, TraceStep } from '../types/telemetry.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:latest'

const client = new GlantaClient()

interface LlmResult {
  output: string
  tokenInput: number
  tokenOutput: number
  latencyMs: number
}

interface OllamaGenerateResponse {
  response: string
  prompt_eval_count?: number
  eval_count?: number
}

async function ollamaGenerate(prompt: string, model: string): Promise<LlmResult> {
  const start = Date.now()

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  })

  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as OllamaGenerateResponse
  const tokenInput = data.prompt_eval_count ?? 0
  const tokenOutput = data.eval_count ?? 0

  return {
    output: data.response.trim(),
    tokenInput,
    tokenOutput,
    latencyMs: Date.now() - start,
  }
}

async function runStep(
  runId: string,
  stepName: string,
  input: string,
  model: string,
): Promise<{ output: string; tokenInput: number; tokenOutput: number }> {
  const stepId = randomUUID()
  const startedAt = new Date().toISOString()

  const runningStep: TraceStep = {
    stepId,
    runId,
    stepName,
    status: 'running',
    startedAt,
    input,
    model,
  }
  await client.emitStep(runningStep)

  try {
    const result = await ollamaGenerate(input, model)

    const completedStep: TraceStep = {
      ...runningStep,
      status: 'success',
      completedAt: new Date().toISOString(),
      output: result.output,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
      tokenTotal: result.tokenInput + result.tokenOutput,
      latencyMs: result.latencyMs,
    }
    await client.emitStep(completedStep)

    return {
      output: result.output,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
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

async function main(): Promise<void> {
  const runId = randomUUID()
  const input = process.argv.slice(2).join(' ') || 'What is Ollama?'
  const startedAt = new Date().toISOString()

  console.log(`Starting hello-agent run ${runId}`)
  console.log(`Model: ${OLLAMA_MODEL} @ ${OLLAMA_HOST}`)
  console.log(`Input: ${input}`)

  const runningRun: AgentRun = {
    runId,
    agentName: 'hello-agent',
    status: 'running',
    startedAt,
    input,
    metadata: { provider: 'ollama', model: OLLAMA_MODEL },
  }
  await client.emitRun(runningRun)

  let totalInput = 0
  let totalOutput = 0
  let lastOutput = ''

  try {
    const plan = await runStep(
      runId,
      'plan',
      `Plan how to answer the following question. Be concise — bullet points are fine.\n\nQuestion: ${input}`,
      OLLAMA_MODEL,
    )
    totalInput += plan.tokenInput
    totalOutput += plan.tokenOutput
    console.log('  step plan done')

    const answer = await runStep(
      runId,
      'answer',
      `Question: ${input}\n\nPlan:\n${plan.output}\n\nWrite the final answer.`,
      OLLAMA_MODEL,
    )
    totalInput += answer.tokenInput
    totalOutput += answer.tokenOutput
    lastOutput = answer.output
    console.log('  step answer done')

    const completedRun: AgentRun = {
      ...runningRun,
      status: 'success',
      completedAt: new Date().toISOString(),
      output: lastOutput,
      tokenInput: totalInput,
      tokenOutput: totalOutput,
      tokenTotal: totalInput + totalOutput,
      latencyMs: Date.now() - new Date(startedAt).getTime(),
    }
    await client.emitRun(completedRun)

    console.log(`Run complete — view it in the dashboard: /runs/${runId}`)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await client.emitRun({
      ...runningRun,
      status: 'error',
      completedAt: new Date().toISOString(),
      error,
      tokenInput: totalInput || undefined,
      tokenOutput: totalOutput || undefined,
      tokenTotal: totalInput + totalOutput || undefined,
      latencyMs: Date.now() - new Date(startedAt).getTime(),
    })
    throw err
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
