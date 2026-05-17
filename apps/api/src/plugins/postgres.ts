import fp from 'fastify-plugin'
import pg from 'pg'

async function postgresPluginImpl(fastify: import('fastify').FastifyInstance) {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new pg.Pool({ connectionString })

  await pool.query('SELECT 1')

  fastify.decorate('pg', pool)

  fastify.addHook('onClose', async () => {
    await pool.end()
  })
}

export default fp(postgresPluginImpl, {
  name: 'postgres',
})