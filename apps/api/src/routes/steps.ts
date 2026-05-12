import type { FastifyInstance } from 'fastify'
import type { TraceStep } from '../types/telemetry.js'

export async function stepsRoutes(app: FastifyInstance) {
  app.post<{ Body: TraceStep }>('/steps', async (request, reply) => {
    const step = request.body
    console.log('Received step:', step)
    return reply.status(201).send({ received: true, stepId: step.stepId })
  })
}