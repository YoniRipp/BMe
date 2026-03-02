# BeMe — Technology Architecture

BeMe is an event-driven, microservice-ready life-management platform. This document describes the full-stack technology architecture, data flow, and deployment topology.

For per-layer details see [backend/TECH.md](backend/TECH.md) and [frontend/TECH.md](frontend/TECH.md).

---

## Architecture Overview

BeMe follows an **event-driven architecture** with **bounded contexts**. Each domain area (Money, Schedule, Body, Energy, Goals) is a self-contained context that:

- Owns its data and business logic
- Publishes domain events on every write
- Can run on a dedicated database (`*_DATABASE_URL`)
- Can be extracted as a standalone service (`*_SERVICE_URL`)

Cross-context communication is via events, never direct DB access or synchronous write calls between services.

```
┌──────────────────────────────────────────────────────────────────┐
│                          Clients                                 │
│   React SPA (Web)  ·  Capacitor (iOS/Android)  ·  PWA           │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST + JWT
┌──────────────────────▼───────────────────────────────────────────┐
│                    API Gateway / Backend                          │
│   Express  ·  Auth  ·  Rate Limit  ·  Helmet  ·  CORS           │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  Bounded Contexts (logical modules or proxied services) │    │
│   │  Money · Schedule · Body · Energy · Goals · Voice       │    │
│   └─────────────────────────────────────────────────────────┘    │
│   Stripe Webhooks  ·  Subscription Gating (requirePro)           │
└───────┬──────────────────┬───────────────────┬───────────────────┘
        │                  │                   │
   ┌────▼────┐    ┌───────▼───────┐    ┌──────▼──────┐
   │PostgreSQL│    │  Event Bus    │    │   Redis     │
   │ (per-ctx │    │ BullMQ / SQS  │    │ Rate limit  │
   │  or      │    │               │    │ Cache       │
   │  shared) │    │   ┌───────┐   │    │ Voice queue │
   └──────────┘    │   │Consumer│   │    │ Job results │
                   │   └───────┘   │    └─────────────┘
                   └───────────────┘
                          │
                   ┌──────▼──────┐
                   │  Handlers   │
                   │ Analytics   │
                   │ Stats agg.  │
                   └─────────────┘
```

---

## Bounded Contexts

| Context | Owns | Tables | Events |
|---------|------|--------|--------|
| **Identity** | Users, auth, sessions, roles | `users` | `identity.UserRegistered`, `identity.SessionCreated` |
| **Money** | Transactions, balances, categories | `transactions` | `money.TransactionCreated/Updated/Deleted` |
| **Schedule** | Schedule items, recurrence | `schedule_items` | `schedule.ScheduleItemAdded/Updated/Deleted` |
| **Body** | Workouts, exercises | `workouts` | `body.WorkoutCreated/Updated/Deleted` |
| **Energy** | Food entries, daily check-ins | `food_entries`, `daily_check_ins` | `energy.FoodEntryCreated/Updated/Deleted`, `energy.CheckInCreated` |
| **Goals** | Goals, progress tracking | `goals` | `goals.GoalCreated/Updated/Deleted` |
| **Voice** | Voice job orchestration | Redis (job state) | `voice.VoiceJobRequested/Completed/Failed` |
| **Groups** | Groups, members, invitations | `groups`, `group_members`, `group_invitations` | `groups.GroupCreated`, `groups.MemberAdded` |

See [docs/bounded-contexts.md](docs/bounded-contexts.md) for full ownership details.

---

## Deployment Modes

BeMe supports progressive service extraction — not a monolith-to-microservice rewrite:

### Mode A — Single Process (default)

One `node index.js` process. All contexts run as logical modules. Events publish in-memory (or to Redis if `REDIS_URL` set).

### Mode B — API + Event Consumer

Two processes: API server (`node index.js`) and event consumer (`node workers/event-consumer.js`). Events flow through Redis BullMQ. Consumer runs handlers (transaction analytics, stats aggregation).

### Mode C — Gateway + Extracted Services

Set `MONEY_SERVICE_URL`, `SCHEDULE_SERVICE_URL`, etc. The main app becomes a gateway that proxies context routes via `http-proxy-middleware`. Each service runs independently (`money-service.js`, `schedule-service.js`, etc.) with its own DB (`MONEY_DATABASE_URL`, etc.).

The client always talks to one `VITE_API_URL` — the gateway. No frontend changes needed.

---

## Event System

All write paths publish domain events. The event bus supports two transports:

| Transport | Config | Use Case |
|-----------|--------|----------|
| **Redis (BullMQ)** | `REDIS_URL` + `EVENT_TRANSPORT=redis` | Default. Low latency. Single-region. |
| **AWS SQS** | `EVENT_TRANSPORT=sqs` + `EVENT_QUEUE_URL` + `AWS_REGION` | Multi-region. Serverless consumers (Lambda). |

**Event envelope** — every event has: `eventId` (UUID), `type` (e.g. `money.TransactionCreated`), `payload`, `metadata` (userId, timestamp, correlationId). Validated with Zod. See [docs/event-schema.md](docs/event-schema.md).

**Consumer contract** — consumers must be idempotent. Use `eventId` for deduplication. See [docs/event-schema.md](docs/event-schema.md).

**Current consumers:**
- `transactionAnalytics` — enriches transaction data on creation
- `statsAggregator` — aggregates daily stats across contexts into `user_daily_stats`

---

## Subscription & Payments

Stripe powers the SaaS subscription model: Free tier (manual data entry) and Pro tier ($4.99/mo — voice, AI insights, AI food lookup).

```
User clicks "Upgrade"
  → POST /api/subscription/checkout
  → Stripe Checkout Session created
  → User completes payment on Stripe
  → Stripe sends webhook to POST /api/webhooks/stripe
  → Backend verifies signature, updates users.subscription_status
  → Next API call: requirePro middleware reads status from DB
  → Pro features unlocked
```

**Key design decisions:**
- Webhook handler uses `express.raw()` mounted before `express.json()` for signature verification
- `requirePro` middleware allows all access when `STRIPE_SECRET_KEY` is not configured (dev convenience)
- `subscription_status` is included in `/api/auth/me` response so frontend can gate UI immediately
- Stripe Customer Portal for self-service management (cancel, update payment)

---

## Voice Pipeline

Voice is the primary UX differentiator, gated behind Pro subscription.

```
Browser Speech API (or Capacitor native)
  → transcript text
  → POST /api/voice/understand
  → Gemini function calling (tool declarations for all contexts)
  → Parsed actions (add_schedule, add_transaction, add_workout, add_food, log_sleep, add_goal, etc.)
  → Frontend executes actions via context APIs
  → Cache invalidation + toast confirmation
```

**Async mode** (when Redis available): Audio sent as base64 → BullMQ job → worker calls Gemini → result stored in Redis → client polls `GET /api/jobs/:jobId`.

**Language:** Auto-detect (browser default). No hardcoded language.

---

## Mobile

The same React SPA is wrapped with **Capacitor** for native iOS/Android distribution:

- **Native speech** via `@capacitor-community/speech-recognition`
- **Web fallback** via Browser Speech API
- **PWA** support with Workbox (service worker, offline caching)
- **Stripe Checkout** opens in system browser (Capacitor default)

Build: `npm run build && npx cap sync` → open in Xcode / Android Studio.

---

## Tech Stack Summary

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI (Radix), Recharts, React Router v6, TanStack Query, Zod, React Hook Form |
| Backend | Node.js (ES modules), Express, TypeScript, PostgreSQL (pg), Pino, Helmet |
| Auth | JWT, bcrypt, google-auth-library, Social OAuth (Google, Facebook, Twitter) |
| Payments | Stripe (Checkout, Customer Portal, Webhooks) |
| Voice | Google Gemini (@google/generative-ai), function calling, BullMQ |
| Event bus | BullMQ (Redis), @aws-sdk/client-sqs (optional), Zod event envelope |
| Gateway | http-proxy-middleware (when `*_SERVICE_URL` set) |
| Redis | Rate limiting, food search cache, BullMQ queue, job results, event bus |
| Mobile | Capacitor (iOS/Android), @capacitor-community/speech-recognition, PWA (Workbox) |
| Migrations | node-pg-migrate |
| Testing | Vitest, Testing Library, jsdom, supertest |
| Infrastructure | Docker, Docker Compose, Railway, AWS (target) |

---

## Security

| Area | Implementation |
|------|----------------|
| HTTPS | Enforced in production |
| Headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Explicit origin whitelist (`CORS_ORIGIN`) |
| Rate limiting | express-rate-limit + Redis store (distributed) |
| Auth | JWT with expiry; bcrypt for passwords |
| Stripe | Webhook signature verification; raw body parser |
| Validation | Zod at all boundaries (config, request bodies, events) |
| SQL injection | Parameterized queries via `pg` |

---

## Documentation Index

- [README.md](README.md) — Project overview and quick start
- [backend/README.md](backend/README.md) — Backend API, config, endpoints
- [frontend/README.md](frontend/README.md) — Frontend structure, routing, state
- [backend/TECH.md](backend/TECH.md) — Backend architecture deep-dive
- [frontend/TECH.md](frontend/TECH.md) — Frontend architecture deep-dive
- [docs/bounded-contexts.md](docs/bounded-contexts.md) — Context ownership
- [docs/event-schema.md](docs/event-schema.md) — Event envelope and contract
- [docs/architecture-principles.md](docs/architecture-principles.md) — Design rules
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — Branches, tags, CI/CD
- [CHANGELOG.md](CHANGELOG.md) — Release history
