# Glanta Roadmap — Portfolio + Robust Platform

> **Direction (June 2026):** Lead with the DevOps/deployment story (Docker → Terraform → EKS → CI/CD) while hardening the observability platform in parallel so it survives real agents and a public demo — not just localhost.

**Completed:** Dashboard MVP — see [DASHBOARD_PLAN.md](./DASHBOARD_PLAN.md).

---

## Strategic bet

Two goals, one sequence:

| Goal | What “done” looks like |
|------|------------------------|
| **Portfolio / DevOps** | Terraform-managed AWS stack (EKS + RDS + ECR), containerized apps, GitHub Actions pipeline, tear-down/recreate documented |
| **Robust observability** | Validated ingest API, SDK helpers agents actually use, multi-step real agents, auth before public exposure |

**Principle:** Never deploy a hollow demo. Each infra milestone should run against an API and SDK you would trust with a real agent — validation, tests, and instrumentation land *before* or *alongside* the matching deploy step, not after.

---

## Current state

| Layer | Status |
|-------|--------|
| API ingest + read | ✓ `POST/GET /runs`, `POST /steps`, health/ready |
| Dashboard | ✓ MVP complete (polling, filters, trace timeline) |
| Local stack | ✓ Compose Postgres + Vite proxy |
| GlantaClient | Minimal — manual run/step lifecycle, no helpers |
| Real agents | `hello-agent` only (Ollama); seed fakes the rest |
| Infra | None — no Dockerfiles, Terraform, K8s, CI |
| Hardening | No request validation, no tests, duplicated types |

---

## Phased plan

Each phase has **exit criteria** (demoable proof) and **portfolio bullets** (resume/interview language).

```text
Phase 1  Platform foundation     SDK + validation + tests
Phase 2  Containerize            Dockerfiles + prod-like compose
Phase 3  Prove the platform      Real multi-step agent
Phase 4  AWS base (no EKS yet)   Terraform: VPC, RDS, ECR
Phase 5  EKS + K8s               Cluster, manifests, Ingress
Phase 6  CI/CD                  GitHub Actions → ECR → deploy
Phase 7  Production hardening    Auth, CORS, migrations, docs
```

Estimated total: **~8–12 focused sessions** depending on AWS familiarity.

---

### Phase 1 — Platform foundation (~2 sessions)

*Robustness first — everything else builds on this.*

**Work**

1. **Request validation** — JSON Schema (or Fastify schema) on `POST /runs` and `POST /steps`; return `400` with clear errors.
2. **Integration tests** — at least: ingest run → ingest steps → `GET /runs/:runId`; FK violation on step-before-run (`409`).
3. **SDK helpers** (`apps/agents/src/`):
   - `withRun(agentName, input, fn)` — start/finish run, aggregate tokens/latency
   - `runStep(runId, stepName, fn)` — emit running → success/error, return result
4. **Refactor `hello-agent`** to use helpers (proof the SDK works).

**Exit criteria**

- `npm test` passes in `apps/api`
- `hello-agent` is shorter and still shows a 2-step trace in the dashboard
- Malformed POST bodies get `400`, not silent bad data

**Portfolio**

> “Designed a telemetry ingest API with schema validation and integration tests; built an agent SDK that handles run/step lifecycle and error paths.”

---

### Phase 2 — Containerize (~1–2 sessions)

*Bridge to K8s — same images locally and in the cluster.*

**Work**

1. **`apps/api/Dockerfile`** — multi-stage build, non-root user, `NODE_ENV=production`, `/health` + `/ready`.
2. **`apps/web/Dockerfile`** — Vite build → nginx; runtime `VITE_API_URL` or nginx proxy to API service.
3. **`docker-compose.yml` extension** (or `docker-compose.prod.yml`) — api + web + postgres; document one-command demo stack.
4. **CORS** on API — configurable allowed origin(s) for when web and API are separate hosts.

**Exit criteria**

- `docker compose up` (prod profile) → dashboard at `:80` or `:8080`, API healthy, seed/hello-agent works against containerized API
- Images build under 200MB where reasonable

**Portfolio**

> “Containerized Fastify API and React dashboard with health/readiness probes and production-oriented Docker builds.”

---

### Phase 3 — Prove the platform (~1–2 sessions)

*One impressive trace beats three stub agents.*

**Work**

1. **`web-research` agent** — multi-step (e.g. plan → gather → summarize → answer); can use Ollama + mocked “search” step without a real search API.
2. **Optional:** `code-review` agent — single LLM call, shows simple baseline trace.
3. Root npm scripts: `agent:web-research`, etc.

**Exit criteria**

- Run web-research agent → dashboard shows 4+ steps with tokens, latency, models
- Failure path: one step errors → run shows `error` status with step-level detail

**Portfolio**

> “Instrumented multi-step LLM agents with framework-agnostic telemetry; traces visible in a custom observability dashboard.”

---

### Phase 4 — AWS base, no EKS (~2 sessions)

*Learn Terraform without the ~$0.10/hr control-plane burn until the app is container-ready.*

**Work**

1. **`infra/terraform/`** modules or flat layout:
   - VPC + public/private subnets
   - RDS PostgreSQL (same schema as `db/schema.sql`)
   - ECR repositories for `glanta-api` and `glanta-web`
   - Security groups (RDS not public; EKS prep)
   - IAM roles (ECR push, later EKS node/instance roles)
2. **Outputs:** RDS endpoint, ECR URLs, connection string template.
3. **Docs:** `terraform apply` / `terraform destroy`, cost warning, state backend note (S3 + DynamoDB optional stretch).

**Exit criteria**

- `terraform apply` creates RDS + ECR; local API connects to RDS with `DATABASE_URL` (manual test)
- `terraform destroy` tears down cleanly

**Portfolio**

> “Provisioned AWS infrastructure with Terraform: VPC, RDS PostgreSQL, ECR, IAM, and security groups.”

---

### Phase 5 — EKS + Kubernetes (~2–3 sessions)

**Work**

1. **Terraform:** EKS cluster + managed node group (or one t3.small node group for cost control).
2. **`infra/k8s/`** manifests:
   - `glanta-api` — Deployment, Service, env from Secret (`DATABASE_URL`), liveness `/health`, readiness `/ready`
   - `glanta-web` — Deployment, Service, nginx config for API upstream or env for API URL
   - Ingress (ALB Ingress Controller or nginx) — single host or path-based routing
3. **Push images to ECR**, deploy with `kubectl apply`.
4. **Run hello-agent or web-research** against cluster API URL (local machine → Ingress).

**Exit criteria**

- Public or VPN-reachable URL shows dashboard with runs from a live agent POST
- `kubectl get pods` all ready; RDS reachable only from cluster SG

**Portfolio**

> “Deployed a full stack on AWS EKS: containerized API and web behind Ingress, with RDS Postgres managed by Terraform.”

---

### Phase 6 — CI/CD (~1 session)

**Work**

1. **GitHub Actions** workflow:
   - On push to `main` (or manual dispatch): build api + web images, push to ECR, update K8s manifests (image tag) and apply
2. **Secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or OIDC to AWS (stretch).
3. **Optional:** separate `plan` job for Terraform on PR.

**Exit criteria**

- Merge to main → new images in ECR → cluster rolls out (or documented manual `kubectl apply` step if auto-deploy is deferred)

**Portfolio**

> “Built a CI/CD pipeline with GitHub Actions: build, push to ECR, deploy to EKS.”

---

### Phase 7 — Production hardening (~1–2 sessions)

*Required before leaving the cluster up or sharing a URL widely.*

**Work**

1. **Ingestion auth** — API key header (e.g. `X-Glanta-Key`) on `POST /runs` and `POST /steps`; env `GLANTA_API_KEY`.
2. **Read path** — optional: same key or separate read-only key; document tradeoff for demo vs prod.
3. **DB migrations** — adopt node-pg-migrate, Drizzle, or Flyway; stop relying on initdb-only `schema.sql` for RDS changes.
4. **Shared types** — `packages/types` published internally or copied via build script to stop api/web/agents drift.
5. **README** — “Deploy to AWS” section: prerequisites, apply order, destroy, monthly cost ballpark.

**Exit criteria**

- Unauthenticated POST returns `401`
- Schema change goes through a migration, not hand-edited RDS
- README documents full deploy path end-to-end

**Portfolio**

> “Hardened a production telemetry API with API-key auth, database migrations, and documented AWS deployment runbooks.”

---

## Explicitly later (post-roadmap)

| Item | Why defer |
|------|-----------|
| WebSocket / SSE live updates | Polling is fine for portfolio demo |
| Cost per run / model pricing | Needs pricing table + product decisions |
| LangChain / CrewAI SDK hooks | After hand-rolled agents + deploy story is solid |
| Helm / ArgoCD | Plain manifests first; GitOps is a follow-on chapter |
| Prometheus + Grafana | Infra observability, not agent observability |
| TimescaleDB | Optimize when query volume demands it |

---

## Suggested session order (checklist)

Use this as the default “what’s next” when resuming work:

- [x] **1a.** JSON Schema on ingest routes
- [x] **1b.** API integration tests
- [x] **1c.** SDK `withRun` / `runStep` + refactor hello-agent
- [ ] **2a.** Dockerfile `glanta-api`
- [ ] **2b.** Dockerfile `glanta-web`
- [ ] **2c.** Compose prod profile + CORS
- [ ] **3a.** `web-research` agent
- [ ] **4a.** Terraform VPC + RDS + ECR
- [ ] **5a.** Terraform EKS + node group
- [ ] **5b.** K8s manifests + Ingress
- [ ] **6a.** GitHub Actions → ECR → EKS
- [ ] **7a.** API key auth + migrations + deploy docs

---

## One-line elevator pitch (target)

> Glanta is an open-source observability platform for AI agents. I built the ingest API and React dashboard in TypeScript, instrumented multi-step LLM agents with a custom SDK, and deployed the stack on AWS EKS with Terraform, RDS, ECR, and a GitHub Actions CI/CD pipeline.

---

## Related docs

- [DASHBOARD_PLAN.md](./DASHBOARD_PLAN.md) — completed MVP UI plan
- [AGENTS.md](../AGENTS.md) — project context and data model
- [README.md](../README.md) — local development quick start
