import 'dotenv/config'
import Fastify from 'fastify'
import postgresPlugin from './plugins/postgres.js'
import { runRoutes } from './routes/runs'
import { stepsRoutes } from './routes/steps'

const app = Fastify({ logger: true })

app.get('/health', async () => {
  return { status: 'ok' }
})

await app.register(postgresPlugin)
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
