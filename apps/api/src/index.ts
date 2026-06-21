import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') })
import postgresPlugin from './plugins/postgres.js'
import { runRoutes } from './routes/runs'
import { stepsRoutes } from './routes/steps'

const app = Fastify({ logger: true })

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

app.register(runRoutes)
app.register(stepsRoutes)

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
