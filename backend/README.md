# BeMe Backend

Node/Express REST API for the BeMe life-management app: authentication, schedule, transactions, workouts, food entries, daily check-ins, goals, food search, and voice intent (Google Gemini). Persistent data is stored in PostgreSQL; the voice pipeline parses natural language and executes actions against the database.

## Overview

The backend serves:

- **Auth**: Register, login (email/password and social: Google, Facebook, Twitter), and `GET /api/auth/me` with JWT.
- **Domain APIs**: CRUD for schedule, transactions, workouts, food entries, daily check-ins, and goals. All are scoped by the authenticated user (or by admin override when supported).
- **Food search**: Public `GET /api/food/search` against the `foundation_foods` table (USDA data).
- **Voice**: `POST /api/voice/understand` – accepts user text, calls Gemini with function declarations, and performs add/edit/delete for schedule, transactions, workouts, food, sleep (daily check-in), and goals.

When `DATABASE_URL` is not set, the server still starts but auth and data APIs are not mounted. When `GEMINI_API_KEY` is not set, the voice understand endpoint returns an error.

For app-wide conventions and the full changelog (Updates 1–11, latest first), see the root [README.md](../README.md) and [UPDATE_11.0.md](../UPDATE_11.0.md).

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js (ES modules) |
| Framework | Express |
| Database | PostgreSQL (pg) |
| Auth | jsonwebtoken, bcrypt, google-auth-library |
| Voice | @google/generative-ai (Gemini) |
| Validation | Zod (config and request body schemas) |
| Env | dotenv |
| CORS | cors |
| Rate limit | express-rate-limit |

## Project Structure

```
backend/
├── app.js                 # Express app: CORS, json, rate limit, auth routes, API router, error handler
├── index.js               # Entry: load config, init DB schema, start HTTP server
├── routes/
│   ├── auth.js            # register, login, loginGoogle, loginFacebook, loginTwitter, twitterRedirect, twitterCallback, me
│   └── users.js           # listUsers, createUser, updateUser, deleteUser (admin)
├── middleware/
│   └── auth.js            # Legacy/auth helpers (if any)
├── src/
│   ├── config/
│   │   ├── index.js       # Load .env, export config (port, dbUrl, jwtSecret, gemini, cors, social keys)
│   │   └── constants.js
│   ├── db/
│   │   ├── index.js       # initSchema, getPool, closePool
│   │   ├── pool.js        # pg Pool
│   │   └── schema.js      # CREATE TABLE users, schedule_items, transactions, goals, workouts, food_entries, daily_check_ins, foundation_foods
│   ├── middleware/
│   │   ├── auth.js        # requireAuth, requireAdmin, getEffectiveUserId, resolveEffectiveUserId
│   │   ├── errorHandler.js
│   │   └── validateBody.js  # Zod request-body validation middleware
│   ├── schemas/
│   │   └── transaction.js  # Zod schemas for transaction create/update
│   ├── routes/
│   │   ├── index.js       # Mount schedule, transaction, workout, foodEntry, dailyCheckIn, goal, foodSearch, voice
│   │   ├── schedule.js
│   │   ├── transaction.js
│   │   ├── workout.js
│   │   ├── foodEntry.js
│   │   ├── dailyCheckIn.js
│   │   ├── goal.js
│   │   ├── foodSearch.js
│   │   └── voice.js
│   ├── controllers/       # One per domain (list, add, update, remove; balance for transactions)
│   ├── services/          # Business logic per domain
│   ├── models/            # Data access per domain
│   ├── utils/
│   │   ├── response.js    # sendJson, sendError, sendCreated, sendNoContent
│   │   ├── validation.js
│   │   └── serviceHelpers.js
│   └── errors.js
├── voice/
│   └── tools.js           # Gemini function declarations (add_schedule, add_transaction, add_workout, add_food, log_sleep, add_goal, etc.)
├── scripts/
│   └── importFoundationFoods.js   # One-time USDA Foundation Foods import
├── mcp-server/            # MCP server (see mcp-server/README.md)
└── package.json
```

## Scripts

From `backend/`:

| Script | Description |
|--------|-------------|
| `npm start` | `node index.js` – start server |
| `npm run dev` | `node --watch index.js` – start with auto-reload |
| `npm run import:foods` | Run `scripts/importFoundationFoods.js` (requires `DATABASE_URL` and Foundation Foods JSON path) |
| `npm run seed:popular-foods` | Replace all foods with ~100 popular foods (see [Food import](#food-import)) |
| `npm run remove:non-foundation-foods` | Remove foods not in Foundation JSON (run from `backend/`) |

From repo root: `npm run start:backend` or `npm run dev:backend`.

## Configuration

Configuration is loaded from [src/config/index.js](src/config/index.js): first `backend/.env`, then `.env.{NODE_ENV}` (e.g. `.env.development`, `.env.production`). All config is validated at startup with a Zod schema; invalid values throw on boot.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | For data/auth/voice/food | PostgreSQL connection string |
| `JWT_SECRET` | Yes in production | Secret for signing JWTs; dev default exists |
| `GEMINI_API_KEY` | For voice | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: `gemini-2.5-flash`) |
| `PORT` | No | HTTP port (default: 3000) |
| `FRONTEND_ORIGIN` | No | Frontend origin (default: `http://localhost:5173`) |
| `CORS_ORIGIN` | No | CORS allowed origin; overrides default |
| `GOOGLE_CLIENT_ID` | For Google login | OAuth client ID |
| `FACEBOOK_APP_ID` | For Facebook login | Facebook app ID |
| `TWITTER_CLIENT_ID` | For Twitter login | Twitter OAuth client ID |
| `TWITTER_CLIENT_SECRET` | For Twitter callback | Twitter client secret |
| `TWITTER_REDIRECT_URI` | No | Callback URL (default: `http://localhost:3000/api/auth/twitter/callback`) |

- **Missing `DATABASE_URL`**: Server starts; auth routes and data API are not mounted; warnings logged.
- **Missing `GEMINI_API_KEY`**: Warning logged; `POST /api/voice/understand` will return an error.

## Database

PostgreSQL schema is defined in [src/db/schema.js](src/db/schema.js). On startup, if `DATABASE_URL` is set, the app runs `initSchema()` which creates (if not exists):

| Table | Description |
|-------|-------------|
| `users` | id, email, password_hash, name, role (admin/user), auth_provider, provider_id |
| `schedule_items` | id, title, start_time, end_time, category, emoji, order, is_active, group_id, user_id, recurrence |
| `transactions` | id, date, type (income/expense), amount, category, description, is_recurring, group_id, user_id |
| `goals` | id, type, target, period, user_id |
| `workouts` | id, user_id, date, title, type (strength/cardio/flexibility/sports), duration_minutes, exercises (jsonb), notes |
| `food_entries` | id, user_id, date, name, calories, protein, carbs, fats |
| `daily_check_ins` | id, user_id, date, sleep_hours |
| `foods` | id, name, calories, protein, carbs, fat (reference foods; used by food search) |

Domain tables reference `users(id)`. Food search uses the `foods` table (index on `lower(name)`).

### Using Supabase

To store all data (including reference foods) in Supabase:

1. Set **DATABASE_URL** to your Supabase Postgres connection string (Project Settings → Database → Connection string, URI).
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` (and other vars). For production (e.g. Railway), set `DATABASE_URL` in the service Variables.
3. Start the backend so `initSchema()` runs and creates tables in Supabase.
4. Run the food import once so reference foods are in Supabase: from `backend/` run `npm run import:foods`, or from repo root `node backend/scripts/importFoundationFoods.js`.

## API Overview

All paths under `/api` are rate-limited (200 requests per 15 minutes per IP). JSON request/response; errors return `{ error: string }`.

### Auth (mounted only when DB is configured)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (email, password, name) |
| POST | `/api/auth/login` | Login (email, password) → JWT |
| POST | `/api/auth/google` | Google OAuth token → JWT |
| POST | `/api/auth/facebook` | Facebook token → JWT |
| POST | `/api/auth/twitter` | Twitter token → JWT |
| GET | `/api/auth/twitter/redirect` | Redirect to Twitter OAuth |
| GET | `/api/auth/twitter/callback` | Twitter OAuth callback |
| GET | `/api/auth/me` | Current user (requires auth) |

### Users (admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List users (requireAuth + requireAdmin) |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Schedule

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/schedule` | List (withUser) |
| POST | `/api/schedule` | Add item |
| POST | `/api/schedule/batch` | Add multiple |
| PATCH / PUT | `/api/schedule/:id` | Update |
| DELETE | `/api/schedule/:id` | Delete |

### Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List (withUser) |
| POST | `/api/transactions` | Add |
| PATCH | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |
| GET | `/api/balance` | Balance for month (withUser) |

### Workouts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workouts` | List (withUser) |
| POST | `/api/workouts` | Add |
| PATCH | `/api/workouts/:id` | Update |
| DELETE | `/api/workouts/:id` | Delete |

### Food entries

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/food-entries` | List (withUser) |
| POST | `/api/food-entries` | Add |
| PATCH | `/api/food-entries/:id` | Update |
| DELETE | `/api/food-entries/:id` | Delete |

### Daily check-ins (sleep/wellness)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/daily-check-ins` | List (withUser) |
| POST | `/api/daily-check-ins` | Add |
| PATCH | `/api/daily-check-ins/:id` | Update |
| DELETE | `/api/daily-check-ins/:id` | Delete |

### Goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List (withUser) |
| POST | `/api/goals` | Add |
| PATCH | `/api/goals/:id` | Update |
| DELETE | `/api/goals/:id` | Delete |

### Food search (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/food/search` | Query foods table (no auth); returns `{ name, calories, protein, carbs, fat, referenceGrams }` |

### Voice

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/voice/understand` | Body: `{ text }`. Requires auth. Returns parsed actions (Gemini function calling). |

## Auth Middleware

[src/middleware/auth.js](src/middleware/auth.js):

- **requireAuth**: Reads `Authorization: Bearer <token>`, verifies JWT with `JWT_SECRET`, sets `req.user` (id, email, role). Returns 401 if missing or invalid.
- **requireAdmin**: Use after requireAuth; returns 403 if `req.user.role !== 'admin'`.
- **getEffectiveUserId(req)**: Returns `req.effectiveUserId` if set (admin override), else `req.user.id`.
- **resolveEffectiveUserId**: If the user is admin and `userId` is passed (query or body), validates that the user exists and sets `req.effectiveUserId`; otherwise sets it to `req.user.id`. Use before controllers that support admin override.

Domain routes use a `withUser`-style middleware that resolves the effective user and passes it to controllers so all data is scoped by that user.

## Voice Pipeline

1. Frontend sends `POST /api/voice/understand` with `{ text: "user utterance" }`.
2. Backend loads [voice/tools.js](voice/tools.js) – Gemini function declarations for: add/edit/delete schedule, add/edit/delete transaction, add/edit/delete workout, add/edit/delete food entry, log_sleep, edit/delete check_in, add/edit/delete goal.
3. Backend calls Gemini with the user text and these tools; Gemini returns one or more function calls (name + parameters).
4. Voice service maps each call to an internal action and executes it (schedule, transaction, workout, food entry, daily check-in, goal) using the authenticated user ID.
5. Response is returned to the frontend with the list of actions/results so the UI can update.

## Error Handling

Controllers use [src/utils/response.js](src/utils/response.js): `sendJson`, `sendError`, `sendCreated`, `sendNoContent`. Request bodies for relevant routes (e.g. transactions create/update) are validated with Zod via [validateBody](src/middleware/validateBody.js); invalid payloads return 400 with a schema error message. On validation or application errors, controllers call `sendError(res, statusCode, message)`. The global [errorHandler](src/middleware/errorHandler.js) middleware catches thrown errors and sends a JSON `{ error: string }` response. 4xx/5xx responses are consistently JSON with an `error` field.

## Rate Limiting

[app.js](app.js) applies `express-rate-limit` to all `/api` routes: 200 requests per 15 minutes per IP. Exceeding the limit returns a JSON error message.

## Food Import

The [scripts/importFoundationFoods.js](scripts/importFoundationFoods.js) script reads a USDA FoodData Central Foundation Foods JSON file (e.g. from the project root), parses it, and inserts records into the `foods` table (name, calories, protein, carbs, fat, is_liquid, preparation). Preparation is derived from the description: "uncooked" or "raw" → uncooked; otherwise cooked. When Energy (kcal/kJ) is missing in the JSON, calories are estimated from macros (Atwater). Requires `DATABASE_URL`. Run once after DB setup (and after tables exist in Supabase or your Postgres):

- From `backend/`: `npm run import:foods`
- From repo root: `node backend/scripts/importFoundationFoods.js`

After pulling changes that affect the import script or schema, run the import again to refresh `foods` with the latest logic. To remove foods that were added outside the Foundation list (e.g. Gemini-created or incomplete entries) so they can be re-looked up with full nutrition, run `npm run remove:non-foundation-foods` from `backend/`. See the [root README](../README.md) for the expected file name and placement.

**Alternative: popular foods only** — To wipe the `foods` table and seed it with ~100 common foods (per-100g nutrition, no external JSON), run from `backend/`: `npm run seed:popular-foods`. This replaces all existing foods with a fixed list (chicken, rice, vegetables, fruits, dairy, common prepared foods, etc.).

## MCP Server

The [mcp-server](mcp-server/) directory contains an MCP server that exposes BeMe schedule, transactions, and goals as tools and resources. It communicates only with this backend API (no direct DB access). See **[mcp-server/README.md](mcp-server/README.md)** for run instructions and Cursor MCP configuration.

## Changelog (latest first)

- **Update 11.0** — Infrastructure, resilience & security audit (Layers 1, 2, 4, 5). See root README **Update 11.0** and [UPDATE_11.0.md](../UPDATE_11.0.md).
- **Update 10.0** — Voice Live ([voiceLive.js](src/services/voiceLive.js)), graceful shutdown ([index.js](index.js)). See root README **Update 10.0**.
- **Update 9.0** — Schema, schedule model, voice service, food search. See root README **Update 9.0**.
- **Update 8.0** — Food entry model/service, voice tools. See root README **Update 8.0**.
- **Update 7.0** — Voice/food, dates, Gemini robustness. See root README **Update 7.0**.
- **Update 6.2** — Voice service and tools. See root README **Update 6.2**.
- **Update 6.1** — Docker. See root README **Update 6.1**.
- **Update 6.0** — Docker, MCP server, Zod (config, request validation). See root README **Update 6.0**.
- **Update 5.0** — Monorepo (frontend moved to `frontend/`). See root README **Update 5.0**.
- **Update 4.1** — Logo. See root README **Update 4.1**.
- **Update 4.0** — Backend restructure (src/controllers, services, models, routes, db, middleware, voice/tools), app.js, food import. See root README **Update 4.0**.
- **Update 3.0** — Backend and MCP server, routes, auth, voice, DB. See root README **Update 3.0**.
