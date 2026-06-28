# Glanta — Project Context

> Living document. Update as decisions evolve. Pass to any LLM session to resume work with full context.

---

## What is Glanta?

Glanta is an open-source observability platform for AI agents. It lets you track agent runs, trace execution steps, monitor token usage and costs, and catch failures — all in real time. The tagline: "Like a clearing in the forest, Glanta gives you an unobstructed view of what your agents are doing and why."

**Repo:** https://github.com/konradkelly/Glanta

---

## Goals

Two parallel learning goals drive this project:

1. **Build a real AI agent observability tool** — something genuinely useful, not just a tutorial project
2. **Learn Kubernetes, Terraform, and AWS** — specifically EKS, with the deployment layer built alongside the app from day one

The project is also a portfolio piece targeting DevOps and software development roles.

---

## Stack Decisions

### Backend
- **Runtime:** Node.js
- **Language:** TypeScript (strict mode)
- **Framework:** Fastify — chosen over Express for performance (better suited for high-throughput telemetry ingestion) and first-class TypeScript support
- **Rationale:** Familiarity with Node.js allows faster iteration, keeping app complexity low while the primary learning focus is the deployment layer

### Frontend
- **Framework:** React + TypeScript
- **Purpose:** Real-time dashboard showing agent runs, trace timelines, token usage, and failures

### Storage
- **Database:** PostgreSQL — provisioned via AWS RDS using Terraform
- **Future consideration:** TimescaleDB if time-series query performance becomes a bottleneck

### Infrastructure
- **Container orchestration:** Kubernetes on AWS EKS
- **IaC:** Terraform
- **Container registry:** AWS ECR
- **CI/CD:** GitHub Actions — builds images, pushes to ECR, applies K8s manifests

---

## Repository Structure

```
Glanta/
  apps/
    api/          ← Fastify + TypeScript backend
    web/          ← React dashboard (Vite)
    agents/       ← Test agents + seed script (GlantaClient)
  db/
    schema.sql    ← Postgres schema (runs, steps)
  docs/
    DASHBOARD_PLAN.md
    ROADMAP.md
  infra/
    terraform/    ← EKS cluster, RDS, ECR, VPC, IAM (future)
    k8s/          ← Deployment, Service, Ingress manifests (future)
  docker-compose.yml
  README.md
  AGENTS.md
```

---

## Core Data Model

Defined in `apps/api/src/types/telemetry.ts`.

### Key types

```typescript
export type RunStatus = 'running' | 'success' | 'error'

export type EventType =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'step.started'
  | 'step.completed'
  | 'step.failed'

export interface AgentRun {
  runId: string
  agentName: string
  status: RunStatus
  startedAt: string       // ISO 8601
  completedAt?: string
  input: string
  output?: string
  error?: string
  tokenInput?: number
  tokenOutput?: number
  tokenTotal?: number
  latencyMs?: number
  metadata?: Record<string, unknown>
}

export interface TraceStep {
  stepId: string
  runId: string           // links back to parent run
  stepName: string
  status: RunStatus
  startedAt: string
  completedAt?: string
  input: string
  output?: string
  error?: string
  tokenInput?: number
  tokenOutput?: number
  tokenTotal?: number
  latencyMs?: number
  model?: string          // optional — steps may use different models
  metadata?: Record<string, unknown>
}
```

### Design decisions

- `metadata: Record<string, unknown>` is the escape hatch for framework-specific fields, keeping the schema generic without breaking it for future framework integrations
- `runId` on `TraceStep` provides parent/child relationships via flat records that join on `runId` — simpler to query and store than nested trees
- `model` lives on `TraceStep`, not `AgentRun` — a single run may use different models across steps
- `TelemetryEvent` envelope type was considered but deferred — separate routes are simpler for now

---

## API Design

Decided on separate routes over a single unified `/events` endpoint:

```
POST /runs              → ingest an AgentRun event (upsert by runId)
POST /steps             → ingest a TraceStep event (upsert by stepId)
GET  /runs              → list recent runs (?limit, ?status)
GET  /runs/:runId       → single run with nested steps
GET  /health            → liveness probe
GET  /ready             → readiness probe (checks Postgres)
```

Local dev uses the Vite proxy (`VITE_API_URL=/api`) so the browser never cross-origin calls the API. Add CORS when deploying web and API on separate origins.

The unified envelope approach (`POST /events` with `eventType` discriminator) is a valid future evolution if a webhook-style single ingestion endpoint becomes desirable.

---

## Agent Framework Strategy

**Middle path:** schema is designed to be framework-agnostic from day one, but initial instrumentation targets only simple hand-rolled test agents.

**Test agents (`apps/agents`):**
- [x] `seed.ts` — demo runs/steps for the dashboard (no LLM)
- [x] `hello-agent.ts` — two-step agent with local Ollama (Gemma)
- [ ] Web research agent — multi-step, good for trace visualization
- [ ] Code review agent — single-call, good for baseline telemetry
- [ ] Task decomposition agent — parent/child step relationships

Framework-specific integrations (LangChain, CrewAI, Anthropic SDK hooks) are future scope.

---

## Deployment Architecture

Three workloads in Kubernetes:

| Service | Image | Notes |
|---|---|---|
| `glanta-api` | Custom — pushed to ECR | Fastify backend |
| `glanta-web` | Custom — nginx-served React build | Frontend dashboard |
| `postgres` | AWS RDS | Provisioned by Terraform, not a K8s workload |

**Terraform provisions:** EKS cluster + node group, RDS instance, ECR repositories, VPC + subnets, IAM roles

**Cost note:** EKS control plane costs ~$0.10/hr. Tear down when not in use — Terraform makes recreation straightforward and practicing this is itself a useful skill.

---

## What's Next

**Direction:** Portfolio / DevOps (EKS, Terraform, CI/CD) with a robust observability platform — not a hollow deploy demo. Full phased plan: [`docs/ROADMAP.md`](docs/ROADMAP.md).

**Immediate focus (Phase 2):** Dockerize api/web, prod-like compose, CORS — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

**Completed (Phase 1):**

- [x] JSON Schema validation on `POST /runs` and `POST /steps`
- [x] API integration tests (ingest → read, FK errors, validation 400s)
- [x] SDK helpers (`withRun`, `runStep`) + refactor `hello-agent`

**Completed:**

- [x] Scaffold `apps/api` — Fastify, health/ready, Postgres plugin
- [x] Add ingestion routes: `POST /runs`, `POST /steps`
- [x] Set up PostgreSQL schema and connect via Fastify plugin
- [x] Add read routes: `GET /runs`, `GET /runs/:runId`
- [x] Scaffold `apps/web` React dashboard (MVP — see `docs/DASHBOARD_PLAN.md`)
- [x] Add `apps/agents` with seed script and hello-agent (Ollama)

---

## Deferred / Future Scope

- `TelemetryEvent` unified envelope
- Framework-specific SDK integrations
- TimescaleDB migration for time-series performance
- Cost calculation per run
- Streaming token count support
- Helm chart for easier deployment
- ArgoCD for GitOps
- Prometheus + Grafana for infrastructure observability