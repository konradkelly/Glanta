import Fastify from 'fastify'
import postgresPlugin from './plugins/postgres.js'
import { runRoutes } from './routes/runs.js'
import { stepsRoutes } from './routes/steps.js'

export interface BuildAppOptions {
  logger?: boolean
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: options.logger ?? false,
  })

  await app.register(postgresPlugin)

  app.get('/health', async () => {
    return { status: 'ok' }
  })

  app.get('/ready', async (request, reply) => {
    try {
      await request.server.pg.query('SELECT 1')
      return { status: 'ok', database: 'ok' }
    } catch (err) {
      request.log.error(err, 'readiness check failed')
      return reply.status(503).send({ status: 'error', database: 'unavailable' })
    }
  })

  await app.register(runRoutes)
  await app.register(stepsRoutes)

  return app
}
