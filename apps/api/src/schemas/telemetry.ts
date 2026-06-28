const runStatusSchema = {
  type: 'string',
  enum: ['running', 'success', 'error'],
} as const

const isoTimestampSchema = {
  type: 'string',
  pattern: '^\\d{4}-\\d{2}-\\d{2}T',
  minLength: 20,
} as const

const optionalNonNegativeInteger = {
  type: 'integer',
  minimum: 0,
} as const

const metadataSchema = {
  type: 'object',
  additionalProperties: true,
} as const

export const agentRunBodySchema = {
  type: 'object',
  required: ['runId', 'agentName', 'status', 'startedAt', 'input'],
  additionalProperties: false,
  properties: {
    runId: { type: 'string', minLength: 1 },
    agentName: { type: 'string', minLength: 1 },
    status: runStatusSchema,
    startedAt: isoTimestampSchema,
    completedAt: isoTimestampSchema,
    input: { type: 'string' },
    output: { type: 'string' },
    error: { type: 'string' },
    tokenInput: optionalNonNegativeInteger,
    tokenOutput: optionalNonNegativeInteger,
    tokenTotal: optionalNonNegativeInteger,
    latencyMs: optionalNonNegativeInteger,
    metadata: metadataSchema,
  },
} as const

export const traceStepBodySchema = {
  type: 'object',
  required: ['stepId', 'runId', 'stepName', 'status', 'startedAt', 'input'],
  additionalProperties: false,
  properties: {
    stepId: { type: 'string', minLength: 1 },
    runId: { type: 'string', minLength: 1 },
    stepName: { type: 'string', minLength: 1 },
    status: runStatusSchema,
    startedAt: isoTimestampSchema,
    completedAt: isoTimestampSchema,
    input: { type: 'string' },
    output: { type: 'string' },
    error: { type: 'string' },
    tokenInput: optionalNonNegativeInteger,
    tokenOutput: optionalNonNegativeInteger,
    tokenTotal: optionalNonNegativeInteger,
    latencyMs: optionalNonNegativeInteger,
    model: { type: 'string' },
    metadata: metadataSchema,
  },
} as const
