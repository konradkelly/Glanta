# Glanta

Open-source telemetry and observability for AI agents.

Glanta is an observability platform for AI agents. Track runs, trace execution steps, monitor token usage and costs, and catch failures — all in real time. Like a clearing in the forest, Glanta gives you an unobstructed view of what your agents are doing and why.

## Local development

### Prerequisites

- Docker (for PostgreSQL)
- Node.js 20+

### 1. Start Postgres

```bash
docker compose up -d
```

Postgres listens on `localhost:5433`. Copy `apps/api/.env.example` to `apps/api/.env` if you have not already.

### 2. Start the API

```bash
npm install --prefix apps/api
npm run dev
```

API: `http://localhost:3000`

### 3. Start the dashboard

```bash
npm install --prefix apps/web
npm run dev:web
```

Dashboard: `http://localhost:5173`

### 4. Load sample data

No LLM or API keys required — the seed script POSTs fake runs and steps:

```bash
npm install --prefix apps/agents
npm run seed
```

Or run the hello-agent against local Ollama (requires `gemma4:latest` or set `OLLAMA_MODEL`):

```bash
npm run agent:hello
npm run agent:hello -- "Explain Kubernetes ingress"
```

Copy `apps/agents/.env.example` to `apps/agents/.env` to override `OLLAMA_MODEL` or `OLLAMA_HOST`.
