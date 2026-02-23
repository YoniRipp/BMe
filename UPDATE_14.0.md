# Update 14.0 — Backend Architecture Refactor (TypeScript Monorepo)

Short summary of planned changes. See root [README.md](README.md) Update 14.0 for the full overview.

## Overview

Refactors the backend from a JavaScript monolith into a TypeScript monorepo with three services:

- **API Service**: HTTP handlers only, enqueues heavy work to the queue
- **Workers Service**: Queue consumers for voice parsing, email, food import
- **Scheduler Service**: Cron jobs that enqueue work or run maintenance tasks

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ API Service │────▶│    Queue    │
│   (React)   │     │  (Express)  │     │ (BullMQ/SQS)│
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ PostgreSQL  │     │   Workers   │
                    └─────────────┘     └─────────────┘
                           ▲                   │
                           └───────────────────┘
```

## Key Changes

### TypeScript Migration
- Full migration from JavaScript to TypeScript
- Shared types across all packages via `@beme/core`
- Zod schemas for job payloads and API validation

### Monorepo Structure
- **packages/core**: Shared code (db, redis, queue, models, services, types)
- **packages/api**: Express HTTP server, routes, controllers, middleware
- **packages/workers**: Queue consumers and job processors
- **packages/scheduler**: Cron jobs and scheduled tasks
- Uses Turborepo for builds and npm workspaces

### Queue Abstraction
- Pluggable queue providers: BullMQ (local/dev) or AWS SQS (production)
- Job types: `voice.parse`, `email.send`, `food.import`, `food.lookup`
- Job results stored in Redis with TTL for polling
- `QUEUE_PROVIDER` env var to switch between `bullmq` and `sqs`

### Async API Changes
- `POST /api/voice/understand` returns `{ jobId, status: 'processing', pollUrl }` immediately
- `GET /api/jobs/:jobId` returns job status and result when complete
- Frontend uses polling to fetch results

### Worker Jobs
- **voice.parse**: Gemini voice parsing (2-5s)
- **email.send**: Email sending via Resend
- **food.import**: USDA food data import
- **food.lookup**: Gemini food nutrition lookup

### Scheduler Jobs
- Cleanup expired job results
- Analytics sync
- Future: daily digest emails

## New Environment Variables

| Variable | Description |
|----------|-------------|
| `QUEUE_PROVIDER` | `bullmq` (default) or `sqs` |
| `AWS_REGION` | AWS region for SQS |
| `SQS_VOICE_QUEUE_URL` | SQS queue URL for voice jobs |
| `SQS_EMAIL_QUEUE_URL` | SQS queue URL for email jobs |
| `SQS_FOOD_IMPORT_QUEUE_URL` | SQS queue URL for food import jobs |
| `SQS_FOOD_LOOKUP_QUEUE_URL` | SQS queue URL for food lookup jobs |

## Directory Structure

```
backend/
├── packages/
│   ├── core/              # Shared: config, db, redis, queue, models, services
│   ├── api/               # HTTP service: routes, controllers, middleware
│   ├── workers/           # Queue consumers: voice, email, food
│   └── scheduler/         # Cron jobs
├── package.json           # Workspace root
├── tsconfig.base.json     # Shared TypeScript config
├── turbo.json             # Turborepo config
└── docker-compose.yml     # Multi-service development
```

## Frontend Changes

- `voiceApi.ts` updated to poll for results instead of waiting for sync response
- `pollForResult()` helper for job status polling with timeout
- UI shows loading state while job is processing

## Migration Notes

This is a breaking change for the voice API. The frontend must be updated to use polling before deploying the new backend.

Backward compatibility: The API can optionally support both sync and async modes during migration by checking a query parameter or header.
