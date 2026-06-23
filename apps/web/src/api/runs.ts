import type { AgentRun } from '../types/telemetry'
import { apiGet } from './client'

type RunsResponse = {
  runs: AgentRun[]
}

export async function getRuns(limit = 50): Promise<RunsResponse> {
  return apiGet<RunsResponse>(`/runs?limit=${limit}`)
}
