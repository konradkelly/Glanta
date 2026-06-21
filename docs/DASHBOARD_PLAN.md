# Glanta Dashboard — Implementation Plan

> Plan for the first version of `apps/web`. Review and adjust scope before implementation.

---

## Goal

Build a **read-only React dashboard** that lets you see agent runs and their trace steps — the minimum viable “observability UI” before adding a test agent or deployment infra.

**MVP outcome:** Open the dashboard in a browser, see a list of runs ingested via `POST /runs`, click one, see its steps and key fields (status, tokens, latency, errors).

**Explicitly not in MVP:** Auth, cost calculation, live streaming, framework SDKs, EKS deployment of the web app (local dev first).

---

## Current State

| Layer | Status |
|-------|--------|
| **Ingest** | `POST /runs`, `POST /steps` persist to Postgres |
| **Read API** | **Missing** — dashboard needs new `GET` routes |
| **Health** | `GET /health` (liveness), `GET /ready` (DB readiness) |
| **Frontend** | `apps/web` does not exist yet |
| **CORS** | `@fastify/cors` installed but **not registered** |
| **Shared types** | `AgentRun` / `TraceStep` live in `apps/api` only |

---

## Architecture (MVP)

```text
Browser (apps/web, Vite dev server :5173)
    │  fetch JSON
    ▼
Fastify API (:3000)
    │  SQL
    ▼
PostgreSQL (Docker :5433)
```

**Update strategy for MVP:** Polling (e.g. every 5s on the runs list). WebSockets or SSE can come later when “real-time” becomes a requirement.

---

## Phased Delivery

### Phase 0 — Prerequisites (API)

Small backend work before or in parallel with UI scaffold.

1. **Enable CORS** on the API for local dev (`http://localhost:5173`).
2. **Add read routes** (see [API design](#api-design-read-routes) below).
3. **Add query layer** — e.g. `apps/api/src/db/query.ts` with row → `AgentRun` / `TraceStep` mappers (snake_case ↔ camelCase).
4. **Optional index** — `CREATE INDEX idx_runs_started_at ON runs (started_at DESC)` for faster list queries (can defer until slow).

**Exit criteria:** `curl http://localhost:3000/runs` returns JSON; `curl http://localhost:3000/runs/:runId` includes nested steps.

---

### Phase 1 — Scaffold `apps/web`

1. Create `apps/web` with **Vite + React + TypeScript** (matches AGENTS.md, fast local DX).
2. Add scripts at repo root or in `apps/web/package.json`:
   - `dev` — Vite dev server
   - `build` — production static assets
   - `preview` — serve built assets locally
3. **API base URL** via `VITE_API_URL` (default `http://localhost:3000` in `.env.example`).
4. **Types** — duplicate `RunStatus`, `AgentRun`, `TraceStep` in `apps/web/src/types/telemetry.ts` for now (shared package is deferred).
5. Minimal layout: app shell, header (“Glanta”), main content area.

**Exit criteria:** Empty dashboard loads at `http://localhost:5173` with no console errors.

---

### Phase 2 — Runs list page

**Route:** `/` (home)

**UI:**
- Table or card list of runs, newest first.
- Columns: `runId`, `agentName`, `status`, `startedAt`, `latencyMs`, `tokenTotal`.
- Status badges: `running` (amber), `success` (green), `error` (red).
- Empty state: “No runs yet — POST to /runs or run a test agent.”
- Loading and error states for failed API calls.

**Data:** `GET /runs?limit=50` on mount + poll every 5s.

**Exit criteria:** Runs created via `curl` appear in the list without refresh (within poll interval).

---

### Phase 3 — Run detail + trace timeline

**Route:** `/runs/:runId`

**UI:**
- **Run summary:** input, output, error, tokens, latency, timestamps, metadata (collapsed JSON).
- **Steps list:** ordered by `startedAt`, vertical timeline or stacked cards.
- Per step: `stepName`, `status`, `model`, tokens, latency, input/output preview (truncated with “show more”).
- Back link to runs list.

**Data:** `GET /runs/:runId` (run + steps in one response).

**Exit criteria:** Multi-step run (manual `POST /runs` + several `POST /steps`) renders a readable trace.

---

### Phase 4 — Polish (still MVP-friendly)

Pick what matters for a portfolio demo; none is blocking.

- Auto-refresh indicator (“Updated 3s ago”).
- Filter runs by `status` (client-side on loaded page).
- Basic responsive layout (readable on laptop; mobile optional).
- Simple Glanta visual identity (dark theme, restrained palette — forest/clearing vibe from tagline).

---

## API Design (read routes)

### `GET /runs`

List recent runs.

**Query params (MVP):**

| Param | Default | Notes |
|-------|---------|-------|
| `limit` | `50` | Max 100 |
| `status` | — | Optional filter: `running` \| `success` \| `error` |

**Response:**

```json
{
  "runs": [ { /* AgentRun fields */ } ]
}
```

**SQL sketch:** `SELECT ... FROM runs ORDER BY started_at DESC LIMIT $1`

---

### `GET /runs/:runId`

Single run with all steps.

**Response:**

```json
{
  "run": { /* AgentRun */ },
  "steps": [ { /* TraceStep[], ordered by started_at */ } ]
}
```

**Errors:** `404` if `runId` not found.

---

### Response shape notes

- Use **camelCase** in JSON to match ingestion types (`runId`, `agentName`, `tokenInput`, …).
- Map DB snake_case in the query layer; keep routes thin.
- `metadata` — return parsed object (JSONB), not string.

---

## Frontend Structure (proposed)

```text
apps/web/
  src/
    main.tsx
    App.tsx
    types/
      telemetry.ts
    api/
      client.ts          # fetch wrapper, base URL
      runs.ts            # getRuns(), getRun(runId)
    pages/
      RunsListPage.tsx
      RunDetailPage.tsx
    components/
      Layout.tsx
      StatusBadge.tsx
      RunsTable.tsx
      RunSummary.tsx
      StepsTimeline.tsx
      EmptyState.tsx
    hooks/
      useRuns.ts         # polling hook
```

**Routing:** `react-router-dom` (standard for multi-page SPA).

**Styling (pick one at implementation time):**

| Option | Pros |
|--------|------|
| **Plain CSS modules** | No extra deps, full control |
| **Tailwind** | Fast UI, common in portfolios |

Recommendation: **CSS modules** for MVP to keep dependency surface small; revisit Tailwind if velocity matters more.

---

## Local Development

```text
Terminal 1:  docker compose up -d          # Postgres on :5433
Terminal 2:  npm run dev --prefix apps/api # API on :3000
Terminal 3:  npm run dev --prefix apps/web # Vite on :5173
```

**Env files:**

| File | Purpose |
|------|---------|
| `apps/api/.env` | `DATABASE_URL=...@localhost:5433/glanta` |
| `apps/web/.env` | `VITE_API_URL=http://localhost:3000` |
| `apps/web/.env.example` | Committed template |

---

## Security & Scope (MVP)

- **No auth** on read or write — acceptable for localhost only.
- Document that public deployment will need API keys or network policies later.
- **Read-only UI** — no delete/edit in dashboard for MVP.
- CORS restricted to dev origins initially (`localhost:5173`).

---

## Out of Scope (defer)

- WebSocket / SSE live updates
- Search, pagination UI beyond `limit`
- Cost per run / model pricing
- Dashboard for infra metrics (Prometheus/Grafana)
- Docker/K8s packaging of `glanta-web` (follows after MVP works locally)
- Shared `packages/types` monorepo package
- GET `/steps` as a top-level route (nested under run is enough for MVP)

---

## Success Criteria (definition of done)

1. [ ] `GET /runs` and `GET /runs/:runId` implemented and tested with `curl`.
2. [ ] CORS allows browser requests from Vite dev server.
3. [ ] `apps/web` scaffold builds with `npm run build`.
4. [ ] Runs list shows ingested data with status and timestamps.
5. [ ] Run detail shows step timeline for a multi-step trace.
6. [ ] README or AGENTS.md updated with “run the dashboard” instructions (after implementation).

---

## Suggested Implementation Order

```text
1. API read routes + CORS          (~1 session)
2. Scaffold apps/web               (~1 session)
3. Runs list + polling             (~1 session)
4. Run detail + steps timeline     (~1 session)
5. Polish + docs                   (optional)
```

Total: **~3–4 focused sessions** for a demoable MVP.

---

## Open Questions (for review)

1. **Polling interval** — 5s default OK, or prefer manual refresh only for MVP?
2. **Styling** — CSS modules vs Tailwind?
3. **Monorepo scripts** — add root `package.json` workspaces later, or keep per-app `npm` commands for now?
4. **Run list fields** — show full `input` preview in table or truncate to one line?
5. **Phase 4 polish** — which items are must-have for your portfolio timeline?

---

## Related Docs to Update (after build)

- `AGENTS.md` — mark dashboard scaffold done; add `GET /runs` to API section; fix `tokenUsage` → flat token fields in type examples.
- `README.md` — quick start with web + api + compose.
