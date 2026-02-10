# BeMe Frontend

React single-page application for the BeMe life-management app: dashboard, money, body, energy, schedule, goals, groups, settings, and insights. When `VITE_API_URL` is set and the user is authenticated, all domain data is loaded and saved via the backend API.

## Overview

The frontend is a TypeScript React app built with Vite. It uses React Router for navigation; server data (goals, transactions, schedule, workouts, energy) is fetched and cached with TanStack Query; auth and UI state use React Context. Forms use React Hook Form with Zod validation. The central API client sends a JWT on every request. Public routes are login, signup, and OAuth callback; all other routes are protected and require a logged-in user when the backend is in use.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build | Vite 4 |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| UI components | Shadcn UI (Radix UI primitives) |
| Icons | Lucide React |
| Charts | Recharts |
| Dates | date-fns |
| Server state | TanStack Query (useQuery, useMutation) |
| Client state | React Context API (auth, app, notifications) |
| Validation | Zod (schemas, API/voice parsing) |
| Forms | React Hook Form, @hookform/resolvers (zod) |
| Auth (Google) | @react-oauth/google |
| Testing | Vitest, Testing Library, jsdom |

The API client ([src/core/api/client.ts](src/core/api/client.ts)) stores the JWT in localStorage (via [src/lib/storage.ts](src/lib/storage.ts)) and attaches it as `Authorization: Bearer <token>` to every request. On 401, it clears the token and dispatches an `auth:logout` event so the UI can redirect to login.

For app-wide conventions (dates, week, voice behavior) and Update 7.0, see the root [README.md](../README.md).

## Project Structure

```
frontend/
├── public/                 # Static assets (e.g. logo.png)
├── src/
│   ├── App.tsx             # GoogleOAuthProvider, Providers, AppRoutes
│   ├── main.tsx            # React root
│   ├── routes.tsx          # BrowserRouter, public/protected routes, lazy pages
│   ├── Providers.tsx       # ErrorBoundary, ToastProvider, AuthProvider; AppProviders (QueryClientProvider, feature providers)
│   ├── index.css           # Global and Tailwind styles
│   ├── setupTests.ts       # Vitest/test setup
│   ├── components/
│   │   ├── layout/         # Layout, TopBar, BottomNav
│   │   ├── shared/         # EmptyState, ConfirmationDialog, LoadingSpinner, ThemeToggle, ToastProvider, etc.
│   │   ├── ui/             # Shadcn primitives (button, card, dialog, input, label, tabs, etc.)
│   │   ├── home/           # Dashboard stats, FinancialSummary, ScheduleItem, ScheduleModal
│   │   ├── money/          # TransactionCard, TransactionList, TransactionModal, MonthlyChart
│   │   ├── body/           # WorkoutCard, WorkoutModal, ExerciseList, WeeklyWorkoutGrid, charts
│   │   ├── energy/         # WellnessCard, DailyCheckInModal, FoodEntryModal, CalorieTrendChart, etc.
│   │   ├── goals/          # GoalCard, GoalModal
│   │   ├── groups/         # GroupCard, CreateGroupModal, MemberList, GroupSettingsModal
│   │   ├── voice/          # VoiceAgentButton, VoiceAgentPanel
│   │   ├── auth/           # SocialLoginButtons
│   │   ├── settings/       # AdminUsersSection
│   │   └── onboarding/     # OnboardingTour
│   ├── context/
│   │   ├── AuthContext.tsx # user, login, logout, register, loginWithProvider, loadUser
│   │   ├── AppContext.tsx
│   │   └── NotificationContext.tsx
│   │   # Feature contexts are re-exported from features (Transaction, Workout, Energy, Schedule, Group, Goals)
│   ├── schemas/            # Zod schemas (transaction, workout, foodEntry, voice)
│   ├── core/
│   │   └── api/
│   │       ├── client.ts   # getApiBase, getToken, setToken, request, handleUnauthorized
│   │       ├── auth.ts     # login, register, me, google, etc.
│   │       ├── food.ts
│   │       ├── goals.ts
│   │       ├── schedule.ts
│   │       ├── transactions.ts
│   │       ├── users.ts
│   │       └── workouts.ts
│   ├── features/
│   │   ├── auth/           # auth API and types
│   │   ├── money/          # api, mappers, TransactionContext, useBalanceByPeriod, useTransactionFilters, components
│   │   ├── body/           # api, mappers
│   │   ├── energy/         # api, mappers
│   │   ├── goals/          # api, useGoalProgress
│   │   ├── schedule/       # api, mappers
│   │   ├── settings/       # settings logic
│   │   └── groups/         # groups logic
│   ├── hooks/
│   │   ├── useTransactions.ts, useWorkouts.ts, useEnergy.ts, useSchedule.ts, useGoals.ts
│   │   ├── useDebounce.ts, useLocalStorage.ts, useSettings.ts, useFormat.ts, useGroups.ts
│   │   └── *.test.ts
│   ├── lib/
│   │   ├── constants.ts    # MOCK_USER, SAMPLE_*, LIMITS, DEFAULTS, VALIDATION_RULES
│   │   ├── queryClient.ts  # TanStack Query client and query keys
│   │   ├── storage.ts     # Storage keys, token key
│   │   ├── utils.ts
│   │   ├── validation.ts
│   │   ├── analytics.ts
│   │   ├── voiceApi.ts    # understand(), VoiceAction types (parsed via Zod)
│   │   ├── export.ts
│   │   └── api.ts         # Re-exports for API/token
│   ├── pages/
│   │   ├── Home.tsx, Money.tsx, Body.tsx, Energy.tsx, Groups.tsx, Insights.tsx, Settings.tsx
│   │   ├── Login.tsx, Signup.tsx, AuthCallback.tsx
│   │   └── *.test.tsx
│   └── types/
│       ├── user.ts, transaction.ts, workout.ts, energy.ts, schedule.ts, goals.ts, group.ts, settings.ts
├── index.html
├── vite.config.ts         # React plugin, @ alias to src, Vitest config
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## Scripts

From `frontend/` (or via root `npm run <script>` for dev/build/preview/lint/test):

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (default: http://localhost:5173) |
| `npm run build` | `tsc && vite build` – production build to `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | `tsc --noEmit` – type check only |
| `npm run test` | Run Vitest |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Vitest with coverage |

## Environment Variables

Set in `frontend/.env` or `frontend/.env.development` (and `.env.production` for production). Restart the dev server after changes.

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:3000`). Required for API usage. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (same as backend). Required for Google login. |
| `VITE_FACEBOOK_APP_ID` | Facebook app ID (same as backend). Optional. |

See the [root README](../README.md) for backend/frontend env pairing (e.g. Google client ID must match backend).

## Auth and Routing

- **Public routes**: `/login`, `/signup`, `/auth/callback`.
- **Protected routes**: Everything else (`/`, `/money`, `/body`, `/energy`, `/groups`, `/insights`, `/settings`) is wrapped in `ProtectedRoutes` in [src/routes.tsx](src/routes.tsx). If there is no user (and auth has finished loading), the app redirects to `/login`.

[AuthContext](src/context/AuthContext.tsx) loads the current user by calling `GET /api/auth/me` when a token exists in storage. On 401 (e.g. expired token), the API client clears the token and dispatches `auth:logout`; the context listens and clears the user so the next render redirects to login.

## Provider Order

[Providers.tsx](src/Providers.tsx):

1. **Outer (all routes)**: `ErrorBoundary` → `ToastProvider` → `AuthProvider` → router.
2. **Inside protected routes** (after auth check): `QueryClientProvider` → `AppProvider` → `TransactionProvider` → `WorkoutProvider` → `EnergyProvider` → `ScheduleProvider` → `GroupProvider` → `GoalsProvider` → `NotificationProvider` → app content.

Feature providers use TanStack Query (useQuery for lists, useMutation for add/update/delete) and update the cache on success. They expose the same interface (e.g. `goals`, `goalsLoading`, `addGoal`) so existing hooks like `useGoals()` are unchanged.

## Data Flow

1. User logs in → backend returns JWT → frontend stores token and sets user in AuthContext.
2. Protected app mounts → AppProviders mount → `QueryClientProvider` wraps feature providers. Each feature provider (e.g. TransactionProvider, GoalsProvider) uses `useQuery` to fetch its list (e.g. transactions, goals); the query key and API call live in the provider.
3. `request()` in [src/core/api/client.ts](src/core/api/client.ts) uses `VITE_API_URL` and attaches `Authorization: Bearer <token>`. API responses for transactions are parsed with Zod in [src/core/api/transactions.ts](src/core/api/transactions.ts).
4. Mutations (add/update/delete) use `useMutation` and on success update the query cache via `queryClient.setQueryData`, so the UI reflects changes without a refetch.
5. Pages and components consume context (e.g. `useTransactions()`, `useGoals()`) and call context actions to add/update/delete. Forms (TransactionModal, WorkoutModal, FoodEntryModal) use React Hook Form with Zod resolver for validation.

## Voice

[src/lib/voiceApi.ts](src/lib/voiceApi.ts) exposes `understand(text)`, which sends `POST /api/voice/understand` with the user’s utterance. The backend (Gemini) returns a list of actions (e.g. `add_schedule`, `add_transaction`). The frontend parses these into [VoiceAction](src/lib/voiceApi.ts) and the voice UI ([src/components/voice/VoiceAgentPanel.tsx](src/components/voice/VoiceAgentPanel.tsx)) applies them by calling the relevant context APIs (schedule, transactions, workouts, food, energy/check-in, goals).

## Theming

Settings store the theme (light / dark / system). Inside protected routes, [routes.tsx](src/routes.tsx) applies it in a `useEffect`: for “system” it uses `prefers-color-scheme`; otherwise it toggles the `dark` class on `document.documentElement` so Tailwind dark mode applies.

## Testing

- **Runner**: Vitest; **DOM**: jsdom; **components**: Testing Library.
- **Setup**: [src/setupTests.ts](src/setupTests.ts).
- Tests live next to source (e.g. `AppContext.test.tsx`, `TransactionContext.test.tsx`, `EnergyContext.test.tsx`, `WorkoutContext.test.tsx`, `GoalsContext.test.tsx`, `Body.test.tsx`, `Money.test.tsx`, `Energy.test.tsx`, `Groups.test.tsx`, `Home.test.tsx`, `Settings.test.tsx`) and in `components/shared/` (e.g. `EmptyState.test.tsx`, `SearchBar.test.tsx`), plus hooks and lib tests (`useDebounce.test.ts`, `useLocalStorage.test.ts`, `analytics.test.ts`, `validation.test.ts`, etc.).

Run: `npm run test` (or `test:ui` / `test:coverage`) from `frontend/` or `npm run test` from repo root.

## Vite and path alias

The project uses the `@` alias for `src/` (see [vite.config.ts](vite.config.ts)), so imports like `@/components/...` and `@/lib/...` resolve to `src/`.

## Update 6.0

This section records changes added in this revision and planned library adoptions that are not yet fully reflected in the body of the frontend README.

### Already in the repo (documentation catch-up)

- **lib/dateRanges.ts**: New module for period and trend date ranges using date-fns. Exports `getPeriodRange(period, refDate)` for daily/weekly/monthly/yearly bounds and `getTrendPeriodBounds(period, refDate)` for current vs previous period (week/month/year). Used for balance and trend views.
- **hooks/useThemeEffect.ts**: Hook that applies the selected theme (light/dark/system) to `document.documentElement`. When theme is `system`, it subscribes to `prefers-color-scheme` and re-applies on change. Used in a single place (e.g. protected routes) so theme is applied once. The “Theming” section above still correctly describes behavior; this hook is the implementation detail.
- **TransactionContext**: Implemented in [features/money/TransactionContext.tsx](src/features/money/TransactionContext.tsx) and re-exported from [context/TransactionContext.tsx](src/context/TransactionContext.tsx). Aligns with the note that feature contexts are re-exported from features.
- **Docker**: The frontend has a [Dockerfile](Dockerfile); the root README describes building and running the frontend with Docker and Docker Compose.

### Library adoption (implemented)

The following have been implemented to reduce boilerplate and improve type safety:

- **Zod**: Schemas for form payloads (transaction, workout, food, schedule), API response shapes (e.g. `ApiGoal`, `ApiTransaction`), and voice API actions. Will replace or complement [src/lib/validation.ts](src/lib/validation.ts) and the manual parsers in [src/lib/voiceApi.ts](src/lib/voiceApi.ts). API client may parse responses with `schema.safeParse()` instead of trusting `res.json() as T`.
- **TanStack Query (React Query)**: Server state (goals, transactions, schedule, workouts, energy, groups) via `useQuery` and `useMutation`, with cache invalidation on mutations. Feature providers may become thin wrappers around query/mutation hooks or be replaced by a single `QueryClientProvider` and per-domain hooks.
- **React Hook Form + @hookform/resolvers (zod)**: Forms such as TransactionModal, WorkoutModal, and FoodEntryModal will use `useForm({ resolver: zodResolver(schema) })` instead of manual `formData`/`errors` state and per-field validation.
- **Zustand (optional)**: Optional store for auth or UI state (e.g. theme, modals) to reduce Context nesting after server state moves to TanStack Query.

The frontend README **Tech Stack**, **Provider Order**, **Data Flow**, and **Project Structure** have been updated accordingly. Zustand remains optional for future client-state consolidation.
