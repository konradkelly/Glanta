import type { AgentRun, TraceStep } from '../types/telemetry'
import { apiGet } from './client'

type RunsResponse = {
  runs: AgentRun[]
}

export type RunDetailResponse = {
  run: AgentRun
  steps: TraceStep[]
}

export async function getRuns(limit = 50): Promise<RunsResponse> {
  return apiGet<RunsResponse>(`/runs?limit=${limit}`)
}

export async function getRun(runId: string): Promise<RunDetailResponse | null> {
  const baseUrl = import.meta.env.VITE_API_URL ?? '/api'
  const res = await fetch(`${baseUrl}/runs/${encodeURIComponent(runId)}`)
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json() as Promise<RunDetailResponse>
}
