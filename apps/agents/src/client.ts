import type { AgentRun, TraceStep } from './types/telemetry.js'

const defaultBaseUrl = 'http://localhost:3000'

export class GlantaClient {
  constructor(private readonly baseUrl = process.env.GLANTA_API_URL ?? defaultBaseUrl) {}

  async emitRun(run: AgentRun): Promise<void> {
    await this.post('/runs', run)
  }

  async emitStep(step: TraceStep): Promise<void> {
    await this.post('/steps', step)
  }

  private async post(path: string, body: AgentRun | TraceStep): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`POST ${path} failed (${res.status}): ${text}`)
    }
  }
}
