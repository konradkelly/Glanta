# Glanta Dashboard — Implementation Plan

> **Status: MVP complete** (June 2026). This document records the plan and decisions; see `README.md` for how to run the stack locally.

---

## Goal

Build a **read-only React dashboard** that lets you see agent runs and their trace steps — the minimum viable “observability UI” before adding a test agent or deployment infra.

**MVP outcome:** Open the dashboard in a browser, see a list of runs ingested via `POST /runs`, click one, see its steps and key fields (status, tokens, latency, errors).

**Explicitly not in MVP:** Auth, cost calculation, live streaming, framework SDKs, EKS deployment of the web app (local dev first).

---

## Current State

| Layer | Status |
|-------|--------|
| **Ingest** | `POST /runs`, `POST /steps` persist to Postgres (upsert by ID) |
| **Read API** | `GET /runs`, `GET /runs/:runId` with query layer in `apps/api/src/db/query.ts` |
| **Health** | `GET /health` (liveness), `GET /ready` (DB readiness) |
| **Frontend** | `apps/web` — runs list, run detail, polling, dark theme |
| **Dev proxy** | Vite forwards `/api` → `:3000` (`VITE_API_URL=/api`); no CORS needed locally |
| **Shared types** | Duplicated in `apps/web/src/types/telemetry.ts` and `apps/agents/src/types/telemetry.ts` |
| **Test data** | `apps/agents` — `npm run seed`, `npm run agent:hello` (Ollama) |

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

### Phase 0 — Prerequisites (API) ✓

Small backend work before or in parallel with UI scaffold.

1. **Add read routes** (see [API design](#api-design-read-routes) below). ✓
2. **Add query layer** — e.g. `apps/api/src/db/query.ts` with row → `AgentRun` / `TraceStep` mappers (snake_case ↔ camelCase). ✓
3. **Optional index** — `CREATE INDEX idx_runs_started_at ON runs (started_at DESC)` for faster list queries (can defer until slow). ✓
4. **Vite dev proxy** — `/api` → `:3000` avoids cross-origin in local dev (CORS deferred until deployment). ✓

**Exit criteria:** `curl http://localhost:3000/runs` returns JSON; `curl http://localhost:3000/runs/:runId` includes nested steps.

---

### Phase 1 — Scaffold `apps/web` ✓

1. Create `apps/web` with **Vite + React + TypeScript** (matches AGENTS.md, fast local DX).
2. Add scripts at repo root or in `apps/web/package.json`:
   - `dev` — Vite dev server
   - `build` — production static assets
   - `preview` — serve built assets locally
3. **API base URL** via `VITE_API_URL` (default `/api` using Vite proxy in `.env.example`).
4. **Types** — duplicate `RunStatus`, `AgentRun`, `TraceStep` in `apps/web/src/types/telemetry.ts` for now (shared package is deferred).
5. Minimal layout: app shell, header (“Glanta”), main content area.

**Exit criteria:** Empty dashboard loads at `http://localhost:5173` with no console errors.

---

### Phase 2 — Runs list page ✓

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

### Phase 3 — Run detail + trace timeline ✓

**Route:** `/runs/:runId`

**UI:**
- **Run summary:** input, output, error, tokens, latency, timestamps, metadata (collapsed JSON).
- **Steps list:** ordered by `startedAt`, vertical timeline or stacked cards.
- Per step: `stepName`, `status`, `model`, tokens, latency, input/output preview (truncated with “show more”).
- Back link to runs list.

**Data:** `GET /runs/:runId` (run + steps in one response).

**Exit criteria:** Multi-step run (manual `POST /runs` + several `POST /steps`) renders a readable trace.

---

### Phase 4 — Polish (still MVP-friendly) ✓

Implemented for portfolio demo:

- Auto-refresh indicator (“Updated 3s ago”). ✓ — `RefreshIndicator.tsx`
- Filter runs by `status` (client-side on loaded page). ✓ — `StatusFilter.tsx`
- Basic responsive layout (readable on laptop; mobile optional). ✓
- Simple Glanta visual identity (dark theme, restrained palette — forest/clearing vibe from tagline). ✓ — plus `ThemeToggle`, `TreeRingLogo`

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

## Frontend Structure (implemented)

```text
apps/web/
  src/
    main.tsx
    App.tsx
    types/
      telemetry.ts
    api/
      client.ts
      runs.ts
    pages/
      RunsListPage.tsx
      RunDetailPage.tsx
    components/
      Layout.tsx
      StatusBadge.tsx
      StatusFilter.tsx
      RunsTable.tsx
      RunSummary.tsx
      StepsTimeline.tsx
      EmptyState.tsx
      RefreshIndicator.tsx
      TextPreview.tsx
      ThemeToggle.tsx
      logos/TreeRingLogo.tsx
    hooks/
      useRuns.ts
      useRun.ts
      useTheme.ts
      useRelativeTime.ts
```

**Routing:** `react-router-dom`.

**Styling:** Plain CSS in `App.css` and `index.css` (not CSS modules — close enough for MVP).

---

## Local Development

```text
Terminal 1:  docker compose up -d          # Postgres on :5433
Terminal 2:  npm run dev --prefix apps/api # API on :3000
Terminal 3:  npm run dev:web              # Vite on :5173
```

**Env files:**

| File | Purpose |
|------|---------|
| `apps/api/.env` | `DATABASE_URL=...@localhost:5433/glanta` |
| `apps/web/.env` | `VITE_API_URL=/api` (Vite proxy to API on :3000) |
| `apps/web/.env.example` | Committed template |

---

## Security & Scope (MVP)

- **No auth** on read or write — acceptable for localhost only.
- Document that public deployment will need API keys or network policies later.
- **Read-only UI** — no delete/edit in dashboard for MVP.
- Local dev avoids cross-origin via Vite proxy; add CORS before public deployment on separate origins.

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

1. [x] `GET /runs` and `GET /runs/:runId` implemented and tested with `curl`.
2. [x] Vite proxy allows browser requests to the API without cross-origin issues.
3. [x] `apps/web` scaffold builds with `npm run build`.
4. [x] Runs list shows ingested data with status and timestamps.
5. [x] Run detail shows step timeline for a multi-step trace.
6. [x] README and AGENTS.md updated with “run the dashboard” instructions.

---

## Suggested Implementation Order

```text
1. API read routes + Vite proxy    (~1 session)
2. Scaffold apps/web               (~1 session)
3. Runs list + polling             (~1 session)
4. Run detail + steps timeline     (~1 session)
5. Polish + docs                   (optional)
```

Total: **~3–4 focused sessions** for a demoable MVP.

---

## Open Questions (resolved)

1. **Polling interval** — 5s (`POLL_MS` in `useRuns.ts` / `useRun.ts`).
2. **Styling** — plain CSS files, not CSS modules or Tailwind.
3. **Monorepo scripts** — per-app `npm` commands with root shortcuts (`dev`, `dev:web`, `seed`, `agent:hello`).
4. **Run list fields** — table shows runId, agent, status, started, latency, tokens; no input preview in list.
5. **Phase 4 polish** — all items shipped, plus theme toggle and logo.

---

## Related Docs (updated)

- [x] `AGENTS.md` — dashboard and agents marked done; `GET /runs` documented; flat token fields.
- [x] `README.md` — quick start with web + api + compose + seed/hello-agent.
