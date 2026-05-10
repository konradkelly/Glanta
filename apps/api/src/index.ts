import Fastify from 'fastify'
import { runRoutes } from './routes/runs'

const app = Fastify({ logger: true })

app.get('/health', async () => {
  return { status: 'ok' }
})

app.register(runRoutes)

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()