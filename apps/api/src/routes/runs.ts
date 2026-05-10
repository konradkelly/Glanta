import type { FastifyInstance } from 'fastify'
import type { AgentRun } from '../types/telemetry'

export async function runRoutes(app: FastifyInstance) {
    app.post<{ Body: AgentRun }>('/runs', async (request, reply) => {
        const run = request.body
        console.log('Received run:', run)
        return reply.status(201).send({ received: true, runId: run.runId })
    })
}
