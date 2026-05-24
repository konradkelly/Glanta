import type { FastifyInstance } from 'fastify'
import type { AgentRun } from '../types/telemetry'
import { upsertRun } from '../db/persist.js'

export async function runRoutes(app: FastifyInstance) {
  app.post<{ Body: AgentRun }>('/runs', async (request, reply) => {
    const run = request.body
    await upsertRun(app.pg, run)
    return reply.status(201).send({ received: true, runId: run.runId })
  })
}
