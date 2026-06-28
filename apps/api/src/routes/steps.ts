import type { FastifyInstance } from 'fastify'
import type { TraceStep } from '../types/telemetry.js'
import { upsertStep } from '../db/persist.js'
import { traceStepBodySchema } from '../schemas/telemetry.js'

export async function stepsRoutes(app: FastifyInstance) {
  app.post<{ Body: TraceStep }>(
    '/steps',
    {
      schema: {
        body: traceStepBodySchema,
      },
    },
    async (request, reply) => {
      const step = request.body
      try {
        await upsertStep(app.pg, step)
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? (err as { code?: string }).code
            : undefined
        if (code === '23503') {
          return reply.status(409).send({
            error: 'foreign_key_violation',
            message: 'Run must exist before steps; POST /runs first for this runId.',
          })
        }
        throw err
      }
      return reply.status(201).send({ received: true, stepId: step.stepId })
    },
  )
}
