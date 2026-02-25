# Changelog

Releases and notable changes, latest first.

## Docs: workflow and architecture diagrams

- Add `docs/WORKFLOW.md` (branches and tags, dev flow).
- Add `docs/architecture-current-railway-supabase.md` (current: Railway + Supabase).
- Add `docs/architecture-target-aws.md` (target: AWS).
- README: add "Branches and tags" section and link to workflow; add "Documentation" section with links to workflow and architecture docs.
- SCALE-HARDEN-AWS: add link to current and target architecture docs.

## Update 14.0 — Backend Architecture Refactor (planned)

**Note:** This refactor was planned but not yet implemented. The current backend remains a JavaScript monorepo with a single Express service.

Planned changes:
- **API Service**: HTTP handlers only, enqueues heavy work
- **Workers Service**: Queue consumers (voice, email, food)
- **Scheduler Service**: Cron jobs
- Full TypeScript migration with shared types via `@beme/core`
- Queue abstraction (BullMQ for dev, AWS SQS for prod)
- Async voice API with job polling (partially implemented: `POST /api/voice/understand` returns jobId for audio, `GET /api/jobs/:id` for result)
- New packages: `packages/core`, `packages/api`, `packages/workers`, `packages/scheduler`
- Turborepo for monorepo builds

## Update 13.0 — Redis Integration

Adds optional Redis for:
- Distributed rate limiting (express-rate-limit + rate-limit-redis)
- Food search caching
- BullMQ voice queue (async audio processing)
- Job result storage

Backend runs without Redis when `REDIS_URL` is unset; uses in-memory rate limiting and sync-only voice (transcript only).

## Update 12.0 — Testing, security, observability, and data foundation

### Testing
- Backend tests: Vitest with unit tests for `src/utils/validation.js`, `src/services/appLog.js`, `src/services/transaction.js`
- CI: `.github/workflows/ci.yml` runs backend and frontend lint, test, build

### Security
- Helmet HTTP security headers
- Auth rate limit: 10 requests per 15 min for `/api/auth/login` and `/api/auth/register`
- Dependabot for dependency updates

### Observability
- Structured logging with Pino
- Health: `GET /health` (always 200); `GET /ready` (200 if DB and Redis reachable, else 503)

### Data
- node-pg-migrate migrations in `backend/migrations/`
- Export from API-backed data (TanStack Query cache)

## Update 11.0 — Infrastructure, resilience & security audit

Five-layer audit of backend, voice/AI, frontend, data, and security. See root README history for recommendations. Key items: connection pooling, indexing, N+1 fixes, CORS, CI/CD.

## Update 10.0 — Voice live, layout refresh, admin UI

- Voice Live (WebSocket at `/api/voice/live`): **now disabled** — code commented out; voice uses Browser Web Speech API → text → sync endpoint, or audio → async job when Redis enabled
- Layout: AppSidebar, Base44Layout, TopBar
- Admin page: AdminLogs, AdminUsersTable
- Graceful shutdown: SIGTERM/SIGINT handling

## Update 9.0

Schedule recurrence and appearance settings; voice executor and schedule types.

## Update 8.0

Food entry and voice improvements; FoodEntryModal, VoiceAgentButton/Panel, voiceActionExecutor.

## Update 7.0

Voice and food robustness, local date conventions, preparation column, Gemini fallback, workout exercises in voice schema, week convention (Sunday–Saturday), layout and UI updates.

## Update 6.x

Docker, MCP server, Zod, TanStack Query, React Hook Form adoption; voice and Dockerfile tweaks.

## Update 5.0

Monorepo layout: frontend moved into `frontend/`.

## Update 4.x

Backend restructure (controllers, services, models); frontend feature modules; voice and API integration.

## Update 3.0

Backend and MCP server added; frontend auth, voice panel, API client, contexts.

## Version 1.x

Initial project documentation and frontend refactors.
