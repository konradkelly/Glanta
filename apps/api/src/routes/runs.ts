import type { FastifyInstance } from 'fastify'
import type { AgentRun, RunStatus } from '../types/telemetry'
import { getRunWithSteps, listRuns } from '../db/query.js'
import { upsertRun } from '../db/persist.js'

const RUN_STATUSES: RunStatus[] = ['running', 'success', 'error']

function parseLimit(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? '50'), 10)
  if (Number.isNaN(parsed)) return 50
  return Math.min(Math.max(parsed, 1), 100)
}

function parseStatus(value: unknown): RunStatus | undefined {
  if (typeof value !== 'string') return undefined
  return RUN_STATUSES.includes(value as RunStatus) ? (value as RunStatus) : undefined
}

export async function runRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: string; status?: string } }>('/runs', async (request) => {
    const status = parseStatus(request.query.status)
    const runs = await listRuns(app.pg, {
      limit: parseLimit(request.query.limit),
      ...(status !== undefined ? { status } : {}),
    })
    return { runs }
  })

  app.get<{ Params: { runId: string } }>('/runs/:runId', async (request, reply) => {
    const result = await getRunWithSteps(app.pg, request.params.runId)
    if (result === null) {
      return reply.status(404).send({ error: 'not_found', message: 'Run not found' })
    }
    return result
  })

  app.post<{ Body: AgentRun }>('/runs', async (request, reply) => {
    const run = request.body
    await upsertRun(app.pg, run)
    return reply.status(201).send({ received: true, runId: run.runId })
  })
}
