import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../../src/app.js'
import type { FastifyInstance } from 'fastify'

const defaultDatabaseUrl = 'postgresql://glanta:glanta@localhost:5433/glanta'

function isoNow(): string {
  return new Date().toISOString()
}

function validRun(overrides: Record<string, unknown> = {}) {
  return {
    runId: `test-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agentName: 'test-agent',
    status: 'running',
    startedAt: isoNow(),
    input: 'test input',
    ...overrides,
  }
}

function validStep(runId: string, overrides: Record<string, unknown> = {}) {
  return {
    stepId: `test-step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    runId,
    stepName: 'test-step',
    status: 'running',
    startedAt: isoNow(),
    input: 'step input',
    ...overrides,
  }
}

describe('ingest API', () => {
  let app: FastifyInstance

  before(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? defaultDatabaseUrl
    app = await buildApp()
    await app.ready()
  })

  beforeEach(async () => {
    await app.pg.query('TRUNCATE steps, runs RESTART IDENTITY CASCADE')
  })

  after(async () => {
    await app.close()
  })

  it('POST /runs then POST /steps then GET /runs/:runId returns nested steps', async () => {
    const run = validRun({ status: 'success', completedAt: isoNow(), output: 'done' })
    const step = validStep(run.runId, {
      status: 'success',
      completedAt: isoNow(),
      output: 'step output',
      tokenInput: 10,
      tokenOutput: 5,
      tokenTotal: 15,
      model: 'test-model',
    })

    const createRun = await app.inject({ method: 'POST', url: '/runs', payload: run })
    assert.equal(createRun.statusCode, 201)

    const createStep = await app.inject({ method: 'POST', url: '/steps', payload: step })
    assert.equal(createStep.statusCode, 201)

    const getRun = await app.inject({ method: 'GET', url: `/runs/${run.runId}` })
    assert.equal(getRun.statusCode, 200)

    const body = getRun.json() as {
      run: { runId: string; agentName: string }
      steps: Array<{ stepId: string; stepName: string; model?: string }>
    }

    assert.equal(body.run.runId, run.runId)
    assert.equal(body.run.agentName, 'test-agent')
    assert.equal(body.steps.length, 1)
    assert.equal(body.steps[0]?.stepId, step.stepId)
    assert.equal(body.steps[0]?.stepName, 'test-step')
    assert.equal(body.steps[0]?.model, 'test-model')
  })

  it('POST /steps before POST /runs returns 409 foreign_key_violation', async () => {
    const step = validStep('missing-run-id')

    const res = await app.inject({ method: 'POST', url: '/steps', payload: step })

    assert.equal(res.statusCode, 409)
    const body = res.json() as { error: string }
    assert.equal(body.error, 'foreign_key_violation')
  })

  it('POST /runs with invalid body returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      payload: {
        runId: '',
        agentName: 'test-agent',
        status: 'running',
        startedAt: isoNow(),
        input: 'hello',
      },
    })

    assert.equal(res.statusCode, 400)
  })

  it('POST /runs with invalid status returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      payload: validRun({ status: 'pending' }),
    })

    assert.equal(res.statusCode, 400)
  })

  it('POST /runs with unknown fields returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/runs',
      payload: {
        ...validRun(),
        extraField: 'nope',
      },
    })

    assert.equal(res.statusCode, 400)
  })

  it('POST /steps with invalid startedAt returns 400', async () => {
    const run = validRun()
    await app.inject({ method: 'POST', url: '/runs', payload: run })

    const res = await app.inject({
      method: 'POST',
      url: '/steps',
      payload: validStep(run.runId, { startedAt: 'not-a-date' }),
    })

    assert.equal(res.statusCode, 400)
  })

  it('POST /steps with negative tokenInput returns 400', async () => {
    const run = validRun()
    await app.inject({ method: 'POST', url: '/runs', payload: run })

    const res = await app.inject({
      method: 'POST',
      url: '/steps',
      payload: validStep(run.runId, { tokenInput: -1 }),
    })

    assert.equal(res.statusCode, 400)
  })
})
