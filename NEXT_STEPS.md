# Next steps

The dashboard MVP is complete. Active planning lives in **[docs/ROADMAP.md](./docs/ROADMAP.md)**.

**Current direction:** Portfolio / DevOps narrative (Docker → Terraform → EKS → CI/CD) with platform robustness built in parallel (validation, tests, SDK, real agents).

**Start here:** Phase 2 in the roadmap — Dockerize api/web, prod-like compose, CORS.

Phase 1 is complete (validation, integration tests, SDK helpers).

The sections below are archived notes from early Postgres wiring (already implemented).

<details>
<summary>Archived: local PostgreSQL + persistence (done)</summary>

Postgres runs via `docker compose up -d` on port `5433`. Schema is in `db/schema.sql`. The API uses `DATABASE_URL` in `apps/api/.env`. See [README.md](./README.md) for the full local dev flow.

</details>
