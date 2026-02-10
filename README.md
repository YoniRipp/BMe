# BeMe – Life Management Application

A comprehensive life-management application for tracking money, body, energy, schedule, goals, and groups—with an optional voice agent and full backend API. Built with React, TypeScript, and Node/Express.

## Features

### Dashboard (Home)
- Financial summary (balance, income, expenses)
- Daily schedule overview and quick edit
- Quick stats (workouts, energy, savings)
- Navigation to all areas

### Money
- Income and expense tracking with categories (Food, Housing, Transportation, etc.; income: Salary, Freelance, Investment, Gift).
- Monthly balance and trend charts; balance by period (daily, weekly, monthly, yearly). Weekly period uses the current calendar week (Sunday–Saturday).
- Transaction categories and recurring support; filter by income / expense / all.
- All transaction dates are sent and stored as local calendar date (YYYY-MM-DD) so daily and weekly views match the user’s timezone.

### Body
- Workout logging with exercise details: name, sets, reps, and weight (in kg). Each workout has a title (default “Workout” or a program name like “SS”) and a list of exercises.
- Form layout: a **Workout** section (title, type, duration, date, notes) and an **Exercises** section with column headers (Exercise name, Sets, Reps, Weight (kg)).
- Weekly workout streak and frequency charts use the current calendar week (Sunday–Saturday). Types: strength, cardio, flexibility, sports; duration and notes.

### Energy
- Daily wellness check-ins and sleep hours tracking.
- Food entries with calories and macros (protein, carbs, fats); calorie and energy trend charts.
- Dates for check-ins and food entries are sent as local calendar date (YYYY-MM-DD) so daily and weekly views are correct.

### Schedule
- Daily schedule items with start/end time and category.
- Categories: Work, Exercise, Meal, Sleep, Personal, Social, Other.
- Optional recurrence (daily, weekdays, weekends). See backend and frontend READMEs for API details.

### Goals
- Goals by type: calories, workouts, savings. Periods: weekly, monthly, yearly.
- Progress tracking on dashboard and insights.

### Groups
- Create and manage groups (household, event, project); member list and settings (invitations placeholder).

### Voice Agent
- Speak in natural language to add or edit schedule, transactions, workouts, food, sleep, and goals. Powered by Google Gemini; requires backend with `GEMINI_API_KEY`. Supports Hebrew and English.
- **Intents**: add/edit/delete for schedule, transaction, workout, food, sleep (check-in), and goals. When the user says only a food or drink name (e.g. “Diet Coke”) with no price, only **add_food** is called; **add_transaction** is used only when the user explicitly states an amount (e.g. “bought coffee for 5”), so no phantom transactions are created.
- **Workouts**: You can say e.g. “I did SS training today, 3x3 150kg squat, 3x3 165kg deadlift.” The workout title defaults to “Workout” when no name is given, or uses the program name (e.g. “SS”). Exercise names (Squat, Deadlift) and sets×reps (e.g. 3x3 = 3 sets of 3 reps; “5 sets of 3 reps”) are parsed and stored. Weight is in kg.
- **Robustness**: If Gemini blocks the request (e.g. safety filter), the backend still returns a single add_food action with the user’s phrase as name and zero nutrition so the user is never blocked from adding an item. Voice and food-lookup calls use relaxed Gemini safety settings to reduce false blocks on benign item names.
- **Example phrases**: “Diet Coke”; “bought coffee for 5”; “I did SS today, squat 3x3 150kg, deadlift 3x3 165kg”; “slept 7 hours”; “add goal 3 workouts per week.”

### Authentication
- Email/password signup and login
- Social login: Google, Facebook, Twitter (when backend and env are configured)
- JWT-based sessions; protected routes require login when using the backend

## Conventions

- **Dates**: All API dates are **local calendar date** in `YYYY-MM-DD` format. The frontend uses `toLocalDateString` when sending and `parseLocalDateString` when reading API date strings ([frontend/src/lib/dateRanges.ts](frontend/src/lib/dateRanges.ts)) so that daily and weekly views and filters match the user’s timezone and avoid UTC-midnight shifting the day.
- **Week**: The first day of the week is **Sunday** and the last is **Saturday**. This is used for weekly workout streak, weekly balance, workout frequency charts, and “workouts this week” on the dashboard. Implemented via `WEEK_SUNDAY` and `getPeriodRange('weekly')` in the same date library and in analytics, balance, and chart code.
- **Weight**: Workout weights are in **kg** in both the voice agent and the UI (e.g. WorkoutModal column “Weight (kg)”).

## Architecture

```mermaid
flowchart LR
  User[User]
  Frontend[Frontend React Vite]
  Backend[Backend Express]
  DB[(PostgreSQL)]
  Gemini[Gemini API]
  MCP[MCP Server]
  User --> Frontend
  Frontend <-->|REST JWT| Backend
  Backend <--> DB
  Backend -.->|voice intent| Gemini
  MCP -.->|HTTP API| Backend
```

- **Frontend**: React SPA; talks to backend when `VITE_API_URL` is set; stores JWT in localStorage and sends it on every API request. Uses local date and week (Sun–Sat) conventions for all date-sensitive features.
- **Backend**: Express API; auth routes (register, login, social), domain APIs (schedule, transactions, workouts, food entries, daily check-ins, goals), food search, and voice `/api/voice/understand`. All domain data is stored in PostgreSQL and scoped by user.
- **Voice**: Backend sends user text to Gemini with function declarations and relaxed safety settings; Gemini returns intent/parameters; backend builds actions (including workout exercises) and returns them. The frontend parses voice responses with Zod (including `exercises` for add_workout) and executes actions (add/edit/delete schedule, transaction, workout, food, sleep, goal). If the voice parse step fails, the backend returns a fallback add_food action so the user is not blocked.
- **MCP server**: Optional stdio server that exposes schedule, transactions, and goals as tools/resources by calling the backend API (see [backend/mcp-server/README.md](backend/mcp-server/README.md)).

## Tech Stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI (Radix), Recharts, React Router v6, TanStack Query (server state), React Context (auth/UI), Zod, React Hook Form, @hookform/resolvers |
| Backend  | Node.js (ES modules), Express, PostgreSQL (pg), JWT, bcrypt, CORS, express-rate-limit, Zod (config and request validation) |
| Voice    | Google Gemini (Generative AI), function calling, relaxed safety settings, fallback on block |
| Auth     | jsonwebtoken, google-auth-library; optional social (Google, Facebook, Twitter) |

## Prerequisites

- **Node.js 18+** and npm (or yarn/pnpm)
- **PostgreSQL** (or compatible host like Supabase) when using the backend for data, auth, food search, or voice “add food”

## Quick Start

### Frontend only

```bash
git clone <repo-url>
cd BMe
npm install
cd frontend && npm install
npm run dev
```

From repo root you can also run `npm run dev` (runs the frontend). Open **http://localhost:5173**.

Without a backend, the app will redirect to login; you need the backend running and configured for full functionality.

### Backend (optional)

```bash
cd backend
npm install
cp .env.example .env   # if available, then edit .env
npm start
```

From repo root: `npm run start:backend` or `npm run dev:backend` (with `--watch`).

Create `backend/.env` with at least:

- `DATABASE_URL` – PostgreSQL connection string (required for data API, auth, food search, voice add_food)
- `JWT_SECRET` – secret for signing JWTs (required in production)
- `GEMINI_API_KEY` – for voice intent (optional; without it, `/api/voice/understand` returns an error)
- `GEMINI_MODEL` – optional; default is `gemini-2.5-flash`. Voice uses relaxed safety settings and a fallback add_food action when the parse step is blocked.

Set `VITE_API_URL=http://localhost:3000` (or your backend URL) in `frontend/.env` or `frontend/.env.development` so the frontend uses the API.

## Running with Docker

You can run the backend and/or frontend in Docker.

**Backend only**

```bash
docker build -t beme-backend ./backend
docker run -p 3000:3000 --env-file backend/.env beme-backend
```

Create `backend/.env` with at least `DATABASE_URL` and `JWT_SECRET` (see [Environment Variables](#environment-variables)).

**Frontend only**

The built app needs the API URL at build time so the browser can call your backend:

```bash
docker build -t beme-frontend --build-arg VITE_API_URL=http://localhost:3000 ./frontend
docker run -p 5173:3000 beme-frontend
```

Open http://localhost:5173. Ensure the backend is reachable at the same URL you passed as `VITE_API_URL` (e.g. run the backend on port 3000).

**Both with Docker Compose**

From the repo root:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3000  

Create `backend/.env` with the required variables. The frontend image is built with `VITE_API_URL=http://localhost:3000` so the browser can call the backend. Set `CORS_ORIGIN=http://localhost:5173` (or the URL where the frontend is served) so the backend allows requests from the frontend; the compose file sets this by default.

**Required env vars (backend)**  
`DATABASE_URL`, `JWT_SECRET`; for voice: `GEMINI_API_KEY`. **Build-arg for frontend:** `VITE_API_URL` (e.g. `http://localhost:3000`).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | For data/auth/voice/food | PostgreSQL connection string |
| `JWT_SECRET` | Yes in production | Secret for signing JWTs |
| `GEMINI_API_KEY` | For voice | Google Gemini API key |
| `GEMINI_MODEL` | No | Model name (default: `gemini-2.5-flash`) |
| `PORT` | No | Server port (default: 3000) |
| `FRONTEND_ORIGIN` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `CORS_ORIGIN` | No | Overrides CORS origin if set |
| `GOOGLE_CLIENT_ID` | For Google login | OAuth client ID (same as frontend) |
| `FACEBOOK_APP_ID` | For Facebook login | Facebook app ID |
| `TWITTER_CLIENT_ID` | For Twitter login | Twitter OAuth client ID |
| `TWITTER_CLIENT_SECRET` | For Twitter callback | Twitter client secret |
| `TWITTER_REDIRECT_URI` | No | Callback URL (default: `http://localhost:3000/api/auth/twitter/callback`) |

Without `DATABASE_URL`, the backend runs but auth and data APIs (schedule, transactions, workouts, food entries, daily check-ins, goals) are disabled. Without `GEMINI_API_KEY`, the voice understand endpoint returns an error.

### Frontend (`frontend/.env` or `frontend/.env.development`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | For backend | Backend base URL (e.g. `http://localhost:3000`) |
| `VITE_GOOGLE_CLIENT_ID` | For Google login | Same as backend `GOOGLE_CLIENT_ID` |
| `VITE_FACEBOOK_APP_ID` | For Facebook login | Same as backend `FACEBOOK_APP_ID` |

Restart the frontend dev server after changing env vars.

## Project Structure

```
BMe/
├── backend/
│   ├── app.js              # Express app, CORS, auth routes, API router
│   ├── index.js            # Entry: config, DB init, start server
│   ├── routes/             # Auth and user routes (top-level)
│   ├── src/
│   │   ├── config/         # Env and constants
│   │   ├── db/             # Pool, schema, init
│   │   ├── middleware/     # Auth, error handler
│   │   ├── routes/         # API route mount (schedule, transactions, etc.)
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data access
│   │   └── utils/          # Response helpers, validation
│   ├── voice/              # Gemini tool declarations
│   ├── mcp-server/         # MCP server (see backend/mcp-server/README.md)
│   ├── scripts/            # importFoundationFoods.js, removeNonFoundationFoods.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, shared, ui, area-specific (home, money, body, energy, goals, groups, voice, auth, settings)
│   │   ├── context/       # Auth, app, and feature contexts
│   │   ├── core/api/       # API client, auth, feature API modules
│   │   ├── features/       # Feature modules (auth, money, body, energy, goals, schedule, settings, groups)
│   │   ├── hooks/          # useTransactions, useWorkouts, useSchedule, etc.
│   │   ├── schemas/        # Zod schemas (transaction, workout, foodEntry, voice)
│   │   ├── lib/            # Constants, storage, utils, validation, voiceApi, queryClient, dateRanges (toLocalDateString, WEEK_SUNDAY)
│   │   ├── pages/          # Home, Money, Body, Energy, Groups, Insights, Settings, Login, Signup, AuthCallback
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # App and providers
│   │   ├── main.tsx        # Entry
│   │   └── routes.tsx      # React Router and protected routes
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── README.md
├── frontend/README.md
├── backend/README.md
└── FoodData_Central_foundation_food_json_*.json   # Optional; for food import
```

## Root Scripts

From repo root ([package.json](package.json)):

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production (`frontend/dist`) |
| `npm run preview` | Serve frontend production build |
| `npm run lint` | Run frontend TypeScript check |
| `npm run test` | Run frontend tests |
| `npm run start:backend` | Start backend server |
| `npm run dev:backend` | Start backend with watch mode |

## Data Flow

- When using the backend, the user must **log in** (email/password or social). The backend returns a JWT; the frontend stores it (e.g. in localStorage) and sends it in the `Authorization: Bearer <token>` header on every request ([frontend/src/core/api/client.ts](frontend/src/core/api/client.ts)).
- The backend validates the JWT in [backend/src/middleware/auth.js](backend/src/middleware/auth.js) for protected routes and attaches `req.user`. Domain APIs (schedule, transactions, workouts, food entries, daily check-ins, goals) use the authenticated user ID; data is stored in PostgreSQL.
- **Server state** on the frontend is fetched and cached via **TanStack Query** (useQuery/useMutation). Feature providers (goals, transactions, schedule, workouts, energy) use queries for lists and mutations for add/update/delete, with cache updates on success. Forms use **React Hook Form** with **Zod** validation (e.g. TransactionModal, WorkoutModal, FoodEntryModal). API and voice responses are parsed with **Zod**; the voice schema includes `exercises` for add_workout so workout exercises from the backend are preserved. Dates sent to or received from the API use local calendar date (toLocalDateString / parseLocalDateString) so views and filters stay correct in all timezones.
- **Food search** (`GET /api/food/search`) is public (no auth). **Voice** (`POST /api/voice/understand`) requires auth; the backend uses Gemini to parse intent and returns actions (schedule, transaction, workout with exercises, food, sleep, goal); the frontend executes them via the API.

## Food Data Import

Food search and voice “add food” use the **USDA Foundation Foods** data in the `foundation_foods` table. One-time import:

1. Place the Foundation Foods JSON file (e.g. `FoodData_Central_foundation_food_json_2025-12-18.json`) in the **project root** (or path expected by the script).
2. Set `DATABASE_URL` in `backend/.env`.
3. From `backend`: `npm run import:foods`  
   Or from repo root: `node backend/scripts/importFoundationFoods.js`

Optional: To remove foods that are no longer in the Foundation Foods JSON (e.g. after pruning the file), run from `backend`: `npm run remove:non-foundation-foods`. That script deletes from `foods` any row whose name is not in the JSON so those items can be re-looked up with full nutrition.

## MCP Server

The backend includes an MCP server that exposes BeMe schedule, transactions, and goals as tools and resources. It talks only to the backend API (no direct DB). See **[backend/mcp-server/README.md](backend/mcp-server/README.md)** for setup and Cursor MCP configuration. For authenticated access (schedule, transactions, goals), configure `BEME_MCP_SECRET` and `BEME_MCP_USER_ID` on the backend and `BEME_MCP_TOKEN` in the MCP env as described there.

## Building for Production

- **Frontend**: `npm run build` (from root or `frontend/`). Output is in `frontend/dist`. Serve with any static host.
- **Preview**: `npm run preview` to test the production build locally.
- **Backend**: Set `NODE_ENV=production`, `JWT_SECRET`, and `DATABASE_URL`; run `npm run start:backend` or use a process manager (e.g. PM2).

## Responsive Design

The app is responsive and works on desktop and mobile. Theme (light/dark/system) is configurable in Settings.

## Update 7.0

This section records changes added in this revision. The main README body (Features, Conventions, Architecture, Data Flow, etc.) has been updated to reflect the current behavior.

### Voice and food

- When the user says only a food or drink name (no amount), only **add_food** is called; **add_transaction** is used only when the user explicitly states a price. This prevents phantom transactions.
- If nutrition lookup (DB + Gemini) fails or Gemini blocks, the backend still returns an add_food action with the user’s phrase as name and zero nutrition so the entry is always created.
- Cooked/uncooked preference is derived from user text; “raw” is normalized to “uncooked” in prompts and UI.

### Dates

- All relevant API calls (money, body, energy) send and interpret dates as **local calendar date** (YYYY-MM-DD). The frontend uses `toLocalDateString` when sending and `parseLocalDateString` when reading API date strings ([frontend/src/lib/dateRanges.ts](frontend/src/lib/dateRanges.ts)) so that daily and weekly views and filters are correct in all timezones. Context and mappers for transactions, workouts, and energy use these helpers.

### Food data and preparation

- A **preparation** column (cooked/uncooked) was added to the foods table. The import script derives it from USDA descriptions; food search and Gemini lookup prefer cooked/uncooked by user intent; naming uses “uncooked” consistently.
- Script **removeNonFoundationFoods.js** (`npm run remove:non-foundation-foods` in backend): deletes from `foods` any row not in the Foundation Foods JSON so items can be re-looked up with full nutrition.

### Gemini voice robustness

- **Safety settings**: Voice and food-lookup Gemini calls use relaxed safety settings (BLOCK_NONE for adjustable categories) so benign food or item names are less likely to be blocked.
- **Fallback on block**: If the voice parse step fails (Gemini error or empty response), the backend returns a single add_food action with the user’s transcript as name and zero nutrition so the user is never blocked from adding an item.

### Workouts (voice)

- **add_workout** supports an **exercises** array (name, sets, reps, weight in kg). Example: “SS training, 3x3 150kg squat, 3x3 165kg deadlift” yields one workout with two exercises.
- **Title**: Default “Workout” when the user does not give a workout name; when they say a program name (e.g. SS), that is used as title. Exercise names are kept as stated (e.g. Squat, Deadlift).
- **Sets and reps**: Convention is sets×reps; e.g. “3x3” = 3 sets of 3 reps; “3 reps 5 sets” = 5 sets of 3 reps. Prompt and tool descriptions were updated so Gemini fills sets/reps correctly.
- **Frontend voice schema**: The add_workout schema in [frontend/src/schemas/voice.ts](frontend/src/schemas/voice.ts) now includes **exercises**. Previously Zod stripped that field and the executor always sent an empty list.

### Workouts (UI)

- **WorkoutModal**: Default title “Workout”; form split into a **Workout** section (title, type, duration, date, notes) and an **Exercises** section with column headers (Exercise name, Sets, Reps, Weight (kg)). Weight unit is kg everywhere. Default and reset for a new workout set the title to “Workout”.

### Week convention

- **Sunday as first day, Saturday as last**. All weekly logic (workout streak, weekly balance, workout frequency charts, “workouts this week” on the dashboard) uses this. Implemented via `WEEK_SUNDAY` and `getPeriodRange('weekly')` in [frontend/src/lib/dateRanges.ts](frontend/src/lib/dateRanges.ts) and used in [WeeklyWorkoutGrid](frontend/src/components/body/WeeklyWorkoutGrid.tsx), analytics, useBalanceByPeriod, WorkoutFrequencyChart, MonthlyChart, and Home.

## Update 6.0

This section records changes added in this revision and planned library adoptions that are not yet fully reflected in the body of the README.

### Already in the repo (documentation catch-up)

- **Docker**: The repo includes `backend/Dockerfile`, `frontend/Dockerfile`, and root `docker-compose.yml`. The main README already describes “Running with Docker” above; the backend and frontend READMEs do not yet list their respective Dockerfiles in project structure.
- **MCP server**: The backend MCP server ([backend/mcp-server/](backend/mcp-server/)) uses **Zod** for validating tool inputs and responses. The main backend app does not yet use Zod for config or request bodies.

### Library adoption (implemented)

The following have been implemented to reduce boilerplate and improve type safety:

- **Zod (frontend and backend)**: Schemas for form payloads, API response shapes, and voice action parsing on the frontend; config validation and request-body validation on the backend. Will replace or complement custom validators in `frontend/src/lib/validation.ts` and `backend/src/utils/validation.js`.
- **TanStack Query (React Query)**: Server state (goals, transactions, schedule, workouts, energy, groups) via `useQuery`/`useMutation` instead of only Context + `useState`/`useEffect`. Will add caching, refetch, and retries; provider tree may be simplified.
- **React Hook Form + @hookform/resolvers (zod)**: Forms (e.g. TransactionModal, WorkoutModal, FoodEntryModal) will use React Hook Form with Zod resolver instead of manual `formData`/`errors` state and ad-hoc validation.
- **Zustand (optional)**: Optional client state store for auth or UI (e.g. theme, modals) to reduce Context nesting after server state moves to TanStack Query.

The main README **Tech Stack** and **Data Flow** sections have been updated accordingly. Zustand remains optional for future client-state consolidation.

## License

MIT

## Contributing

Contributions are welcome. Please open an issue or submit a Pull Request.
