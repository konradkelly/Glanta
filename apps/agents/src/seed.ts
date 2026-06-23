import { GlantaClient } from './client.js'
import type { AgentRun, TraceStep } from './types/telemetry.js'

const client = new GlantaClient()

const runs: AgentRun[] = [
  {
    runId: 'seed-web-research-001',
    agentName: 'web-research',
    status: 'success',
    startedAt: minutesAgo(12),
    completedAt: minutesAgo(11),
    input: 'Summarize recent developments in AI agent observability.',
    output:
      'Agent observability tools focus on tracing multi-step runs, token usage, and failure diagnosis. Glanta fits this space with a framework-agnostic schema.',
    tokenInput: 842,
    tokenOutput: 312,
    tokenTotal: 1154,
    latencyMs: 48_200,
    metadata: { source: 'seed' },
  },
  {
    runId: 'seed-code-review-002',
    agentName: 'code-review',
    status: 'success',
    startedAt: minutesAgo(6),
    completedAt: minutesAgo(5),
    input: 'Review apps/api/src/routes/runs.ts for error handling gaps.',
    output: 'Looks good. Consider validating runId format and returning 400 on malformed bodies.',
    tokenInput: 1204,
    tokenOutput: 186,
    tokenTotal: 1390,
    latencyMs: 6200,
    metadata: { source: 'seed' },
  },
  {
    runId: 'seed-task-decompose-003',
    agentName: 'task-decompose',
    status: 'error',
    startedAt: minutesAgo(2),
    completedAt: minutesAgo(2),
    input: 'Break down deployment of glanta-web to EKS.',
    error: 'Step "plan-ingress" failed: missing cluster context',
    tokenInput: 410,
    tokenOutput: 95,
    tokenTotal: 505,
    latencyMs: 9100,
    metadata: { source: 'seed' },
  },
]

const steps: TraceStep[] = [
  {
    stepId: 'seed-step-search',
    runId: 'seed-web-research-001',
    stepName: 'search',
    status: 'success',
    startedAt: minutesAgo(12),
    completedAt: minutesAgo(11.5),
    input: 'AI agent observability platforms 2026',
    output: 'Found 8 relevant articles and 3 open-source projects.',
    tokenInput: 120,
    tokenOutput: 48,
    tokenTotal: 168,
    latencyMs: 2100,
    model: 'claude-sonnet-4-20250514',
  },
  {
    stepId: 'seed-step-summarize',
    runId: 'seed-web-research-001',
    stepName: 'summarize',
    status: 'success',
    startedAt: minutesAgo(11.5),
    completedAt: minutesAgo(11),
    input: 'Summarize search results into three bullet points.',
    output:
      'Agent observability tools focus on tracing multi-step runs, token usage, and failure diagnosis.',
    tokenInput: 722,
    tokenOutput: 264,
    tokenTotal: 986,
    latencyMs: 4600,
    model: 'claude-sonnet-4-20250514',
  },
  {
    stepId: 'seed-step-review',
    runId: 'seed-code-review-002',
    stepName: 'review',
    status: 'success',
    startedAt: minutesAgo(6),
    completedAt: minutesAgo(5),
    input: 'Review apps/api/src/routes/runs.ts',
    output: 'No critical issues. Suggest input validation for POST bodies.',
    tokenInput: 1204,
    tokenOutput: 186,
    tokenTotal: 1390,
    latencyMs: 6200,
    model: 'gpt-4.1-mini',
  },
  {
    stepId: 'seed-step-decompose',
    runId: 'seed-task-decompose-003',
    stepName: 'decompose',
    status: 'success',
    startedAt: minutesAgo(2.5),
    completedAt: minutesAgo(2.2),
    input: 'Break down EKS deployment for glanta-web.',
    output: '1. Build image 2. Push to ECR 3. Apply manifests 4. Configure ingress',
    tokenInput: 210,
    tokenOutput: 72,
    tokenTotal: 282,
    latencyMs: 3200,
    model: 'llama3.2',
  },
  {
    stepId: 'seed-step-plan-ingress',
    runId: 'seed-task-decompose-003',
    stepName: 'plan-ingress',
    status: 'error',
    startedAt: minutesAgo(2.2),
    completedAt: minutesAgo(2),
    input: 'Draft ingress manifest for glanta-web.',
    error: 'missing cluster context',
    tokenInput: 200,
    tokenOutput: 23,
    tokenTotal: 223,
    latencyMs: 1800,
    model: 'llama3.2',
  },
]

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

async function main(): Promise<void> {
  console.log(`Seeding Glanta at ${process.env.GLANTA_API_URL ?? 'http://localhost:3000'}...`)

  for (const run of runs) {
    await client.emitRun(run)
    console.log(`  run  ${run.runId} (${run.status})`)
  }

  for (const step of steps) {
    await client.emitStep(step)
    console.log(`  step ${step.stepId} (${step.status})`)
  }

  console.log(`Done — ${runs.length} runs, ${steps.length} steps. Open the dashboard to view them.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
