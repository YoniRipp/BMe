# Backend

Express + TypeScript API server with PostgreSQL and optional Redis.

## Commands
- Dev server: `npm run dev` (uses tsx watch)
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build` (tsup)
- Tests: `npm test`
- DB migrate: `npx prisma migrate dev`
- DB generate: `npx prisma generate`

## Architecture
- `app.ts` -- Express app setup, middleware, rate limiting
- `index.ts` -- Server entry point, starts HTTP + optional voice worker
- `src/controllers/` -- Route handlers (thin, delegate to services)
- `src/services/` -- Business logic
- `src/models/` -- DB access (raw SQL via pg Pool, Prisma for schema)
- `src/routes/` -- Route definitions
- `src/events/` -- Domain event bus (memory or SQS transport)
- `src/middleware/` -- Auth, error handling, validation, idempotency
- `src/workers/` -- Background workers (voice processing via BullMQ)

## Patterns
- All route handlers use `asyncHandler` wrapper
- Responses via `sendJson(res, data)` and `sendError(res, status, message)`
- Validation uses Zod schemas or helpers from `utils/validation.ts`
- `normOneOf`, `normTime`, `normCat`, `parseDate`, `validateNonNegative` for input normalization
- Embeddings via Google Generative AI (`text-embedding-004`)

## DB
- PostgreSQL via `pg` Pool (src/db/pool.ts)
- Prisma for schema management only (prisma/schema.prisma)
- Redis optional: rate limiting (RedisStore), BullMQ voice queue, key-value store
