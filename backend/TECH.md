# BeMe Backend — Technical Architecture

The backend is an event-driven Node.js/Express API with bounded contexts, a gateway proxy layer, and Stripe subscription infrastructure.

---

## Runtime

- **Node.js** with ES modules (`"type": "module"` in package.json)
- **TypeScript** for all new source files (`.ts`)
- **Express** HTTP framework
- **Pino** structured JSON logging
- Entry point: `index.ts` → loads config → init DB schema → starts HTTP server → optional voice worker

---

## Database

**PostgreSQL** via `pg` (node-postgres).

### Connection Pool

`getPool(context)` in `src/db/pool.ts` returns a pool per bounded context. Each context can have its own `*_DATABASE_URL` (e.g. `MONEY_DATABASE_URL`); if not set, falls back to `DATABASE_URL`.

```
getPool('money')   → MONEY_DATABASE_URL    || DATABASE_URL
getPool('schedule')→ SCHEDULE_DATABASE_URL  || DATABASE_URL
getPool('body')    → BODY_DATABASE_URL      || DATABASE_URL
getPool('energy')  → ENERGY_DATABASE_URL    || DATABASE_URL
getPool('goals')   → GOALS_DATABASE_URL     || DATABASE_URL
getPool()          → DATABASE_URL (default)
```

### Schema Management

| Environment | Strategy |
|-------------|----------|
| Development | `initSchema()` runs on startup (idempotent `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`). Set `SKIP_SCHEMA_INIT=false`. |
| Production | Set `SKIP_SCHEMA_INIT=true`. Run `npm run migrate:up` before deploy. Migrations in `migrations/` use `node-pg-migrate`. |

### Tables

| Table | Context | Key Columns |
|-------|---------|-------------|
| `users` | Identity | id, email, password_hash, name, role, auth_provider, stripe_customer_id, subscription_status, subscription_id, subscription_current_period_end |
| `transactions` | Money | id, user_id, date, type, amount, currency, category, description, is_recurring, updated_at |
| `schedule_items` | Schedule | id, user_id, title, date, start_time, end_time, category, recurrence, updated_at |
| `workouts` | Body | id, user_id, title, date, type, exercises (jsonb), updated_at |
| `food_entries` | Energy | id, user_id, date, name, calories, protein, carbs, fat, updated_at |
| `daily_check_ins` | Energy | id, user_id, date, sleep_hours, energy_level, mood, notes |
| `goals` | Goals | id, user_id, type, target, period, updated_at |
| `groups` | Groups | id, name, type, owner_id |
| `group_members` | Groups | group_id, user_id, role |
| `group_invitations` | Groups | id, group_id, email, status |
| `foods` | Energy | id, name, calories, protein, carbs, fat (USDA data) |
| `app_logs` | System | id, user_id, level, message, meta |
| `user_embeddings` | AI | id, user_id, embedding (vector), content_type |
| `user_daily_stats` | Analytics | user_id, date, calories, workouts, transactions, sleep_hours |

---

## Event System

Every write (create/update/delete) in a bounded context publishes a domain event.

### Architecture

```
Controller → Service → Model (DB write)
                ↓
           publish(event)
                ↓
         Event Bus (Redis BullMQ or SQS)
                ↓
         Consumer Process (handlers)
```

### Event Bus

- `src/events/bus.ts` — `publish()` and `subscribe()` functions
- `src/events/schema.ts` — Zod schema for event envelope validation
- `src/events/publish.ts` — convenience wrappers per context
- `src/events/transports/sqs.ts` — SQS transport implementation

### Transports

| Transport | Config | Notes |
|-----------|--------|-------|
| Redis (BullMQ) | `REDIS_URL` | Default. Queue name: `events`. |
| AWS SQS | `EVENT_TRANSPORT=sqs`, `EVENT_QUEUE_URL`, `AWS_REGION` | For AWS-native deployments. |

### Consumer Handlers

| Handler | Listens To | Action |
|---------|-----------|--------|
| `transactionAnalytics` | `money.TransactionCreated` | Enriches transaction data |
| `statsAggregator` | Multiple events | Aggregates daily stats into `user_daily_stats` |

Consumer process: `node workers/event-consumer.js` (separate deployable, no HTTP).

---

## Bounded Contexts — Code Organization

Each context follows the pattern: **routes → controller → service → model**.

```
src/
├── routes/           # Express routers per context
│   ├── transaction.ts
│   ├── schedule.ts
│   ├── workout.ts
│   ├── foodEntry.ts
│   ├── dailyCheckIn.ts
│   ├── goal.ts
│   ├── subscription.ts   ← NEW (Stripe)
│   ├── voice.ts
│   └── foodSearch.ts
├── controllers/      # Request handlers (parse req, call service, send response)
├── services/         # Business logic (validation, orchestration)
│   └── subscription.ts   ← NEW (Stripe checkout, portal, webhook)
├── models/           # Data access (SQL queries via pg)
└── middleware/
    ├── auth.ts       # requireAuth, requireAdmin
    ├── requirePro.ts # ← NEW (Pro subscription gating)
    ├── errorHandler.ts
    └── validateBody.ts
```

### Gateway Proxy

When `*_SERVICE_URL` is set (e.g. `MONEY_SERVICE_URL=http://money:3001`), the gateway proxies those routes via `http-proxy-middleware` in `app.ts`. The context routes are excluded from the local router; all traffic for that context goes to the external service.

---

## Authentication

### JWT Flow

1. User registers or logs in → backend signs JWT with `{ id, email, role, subscriptionStatus }`
2. Frontend stores JWT in localStorage, sends `Authorization: Bearer <token>` on every request
3. `requireAuth` middleware verifies JWT, attaches `req.user`
4. `requirePro` middleware (for gated endpoints) checks `subscription_status` from DB

### Social OAuth

- **Google** — `google-auth-library` verifies ID token server-side
- **Facebook** — backend verifies access token against Graph API
- **Twitter** — OAuth 1.0a flow with redirect/callback

---

## Stripe Integration

### Subscription Flow

```
POST /api/subscription/checkout → createCheckoutSession() → Stripe Checkout URL
  → User completes payment on Stripe hosted page
  → Stripe POST /api/webhooks/stripe
  → verifySignature + handleWebhookEvent()
  → UPDATE users SET subscription_status='pro'
  → GET /api/auth/me returns updated status
```

### Webhook Handler

Mounted with `express.raw({ type: 'application/json' })` **before** `express.json()` in `app.ts`. This preserves the raw body for Stripe signature verification.

### Handled Events

| Stripe Event | Action |
|-------------|--------|
| `checkout.session.completed` | Set status = `'pro'`, store subscription_id |
| `customer.subscription.updated` | Update status based on Stripe status |
| `customer.subscription.deleted` | Set status = `'canceled'` |
| `invoice.payment_failed` | Set status = `'past_due'` |

### Pro-Gated Endpoints

| Endpoint | Middleware |
|----------|-----------|
| `POST /api/voice/understand` | `requirePro` |
| `GET /api/insights`, `POST /api/insights/refresh` | `requirePro` |
| `POST /api/food/lookup-or-create` | `requirePro` |

When `STRIPE_SECRET_KEY` is not configured, `requirePro` allows all access (development convenience).

---

## Voice Pipeline

### Sync Mode (text)

```
POST /api/voice/understand { transcript }
  → Gemini function calling with tool declarations
  → Returns { actions: [...] }
```

No Redis required.

### Async Mode (audio)

```
POST /api/voice/understand { audio, mimeType }
  → BullMQ job created → { jobId, pollUrl }
  → Voice worker picks up job → calls Gemini
  → Result stored in Redis
  → Client polls GET /api/jobs/:jobId → { status, result }
```

Requires `REDIS_URL`.

### Gemini Tool Declarations

Defined in `voice/tools.ts`:
- `add_schedule`, `edit_schedule`, `delete_schedule`
- `add_transaction`, `edit_transaction`, `delete_transaction`
- `add_workout`, `edit_workout`, `delete_workout`
- `add_food`, `edit_food`, `delete_food`
- `log_sleep`
- `add_goal`, `edit_goal`, `delete_goal`

---

## Configuration

All config loaded from `src/config/index.ts`. Loads `.env` then `.env.{NODE_ENV}`. Validated with Zod at startup — fails fast on invalid values.

See [backend/.env.development](backend/.env.development) and [backend/.env.production](backend/.env.production) for all variables.
