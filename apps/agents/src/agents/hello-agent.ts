import { GlantaClient } from '../client.js'
import { runStep, withRun } from '../sdk.js'

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

async function main(): Promise<void> {
  const input = process.argv.slice(2).join(' ') || 'What is Ollama?'

  console.log(`Model: ${OLLAMA_MODEL} @ ${OLLAMA_HOST}`)
  console.log(`Input: ${input}`)

  const { output, runId } = await withRun(
    client,
    {
      agentName: 'hello-agent',
      input,
      metadata: { provider: 'ollama', model: OLLAMA_MODEL },
    },
    async (ctx) => {
      console.log(`Starting hello-agent run ${ctx.runId}`)

      const plan = await runStep(
        client,
        ctx,
        {
          stepName: 'plan',
          input: `Plan how to answer the following question. Be concise — bullet points are fine.\n\nQuestion: ${input}`,
          model: OLLAMA_MODEL,
        },
        () =>
          ollamaGenerate(
            `Plan how to answer the following question. Be concise — bullet points are fine.\n\nQuestion: ${input}`,
            OLLAMA_MODEL,
          ),
      )
      console.log('  step plan done')

      const answer = await runStep(
        client,
        ctx,
        {
          stepName: 'answer',
          input: `Question: ${input}\n\nPlan:\n${plan.output}\n\nWrite the final answer.`,
          model: OLLAMA_MODEL,
        },
        () =>
          ollamaGenerate(
            `Question: ${input}\n\nPlan:\n${plan.output}\n\nWrite the final answer.`,
            OLLAMA_MODEL,
          ),
      )
      console.log('  step answer done')

      return { output: answer.output }
    },
  )

  console.log(`Run complete — view it in the dashboard: /runs/${runId}`)
  if (output) {
    console.log(`\nAnswer:\n${output}`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
