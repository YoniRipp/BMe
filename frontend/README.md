# BeMe Frontend

React single-page application for the BeMe life-management app: dashboard, money, body, energy, schedule, goals, groups, settings, insights, subscription management, and a public landing/pricing page. When `VITE_API_URL` is set and the user is authenticated, all domain data is loaded and saved via the backend API.

When the backend is deployed as a gateway with extracted services, set `VITE_API_URL` to the gateway URL; the client still talks to a single origin. No frontend code changes are required for gateway vs monolith.

## Overview

The frontend is a TypeScript React app built with Vite. It uses React Router for navigation; server data (goals, transactions, schedule, workouts, energy) is fetched and cached with TanStack Query; auth and UI state use React Context. Forms use React Hook Form with Zod validation. The central API client sends a JWT on every request. Public routes include login, signup, OAuth callback, landing (`/welcome`), and pricing (`/pricing`); all other routes are protected and require a logged-in user. Pro features (voice, AI insights) are gated via the `useSubscription()` hook.

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
| Mobile | Capacitor (iOS/Android), @capacitor-community/speech-recognition |
| Testing | Vitest, Testing Library, jsdom |

The API client ([src/core/api/client.ts](src/core/api/client.ts)) stores the JWT in localStorage (via [src/lib/storage.ts](src/lib/storage.ts)) and attaches it as `Authorization: Bearer <token>` to every request. On 401, it clears the token and dispatches an `auth:logout` event so the UI can redirect to login.

For frontend architecture deep-dive, see [TECH.md](TECH.md). For app-wide conventions and the full changelog, see the root [README.md](../README.md) and [CHANGELOG.md](../CHANGELOG.md).

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
│   │   ├── body/           # WorkoutCard, WorkoutModal, ExerciseList, charts
│   │   ├── energy/         # WellnessCard, DailyCheckInModal, FoodEntryModal, CalorieTrendChart, etc.
│   │   ├── goals/          # GoalCard, GoalModal
│   │   ├── groups/         # GroupCard, CreateGroupModal, MemberList, GroupSettingsModal
│   │   ├── voice/          # VoiceAgentButton, VoiceAgentPanel, VoiceMicHero
│   │   ├── subscription/   # UpgradePrompt
│   │   ├── auth/           # SocialLoginButtons
│   │   ├── settings/       # AdminUsersSection, SubscriptionSection
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
│   │       ├── subscription.ts  # getStatus, createCheckout, createPortal
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
│   │   ├── useSubscription.ts  # isPro, subscribe, manage
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
│   │   ├── Landing.tsx, Pricing.tsx
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

- **Public routes**: `/welcome` (landing page), `/login`, `/signup`, `/pricing`, `/auth/callback`.
- **Protected routes**: Everything else (`/`, `/money`, `/body`, `/energy`, `/groups`, `/insights`, `/settings`) is wrapped in `ProtectedRoutes` in [src/routes.tsx](src/routes.tsx). If there is no user (and auth has finished loading), the app redirects to `/welcome`.
- **Pro-gated pages**: `/insights` shows `UpgradePrompt` for free users. Voice input on the dashboard (`VoiceMicHero`) requires Pro.

[AuthContext](src/context/AuthContext.tsx) loads the current user by calling `GET /api/auth/me` when a token exists in storage. On 401 (e.g. expired token), the API client clears the token and dispatches `auth:logout`; the context listens and clears the user so the next render redirects to login.

## Provider Order

[Providers.tsx](src/Providers.tsx):

1. **Outer (all routes)**: `ErrorBoundary` → `ToastProvider` → `AuthProvider` → router.
2. **Inside protected routes** (after auth check): `QueryClientProvider` → `AppProvider` → `TransactionProvider` → `WorkoutProvider` → `EnergyProvider` → `ScheduleProvider` → `GroupProvider` → `GoalsProvider` → `NotificationProvider` → app content.

Feature providers use TanStack Query (useQuery for lists, useMutation for add/update/delete) and update the cache on success. They expose the same interface (e.g. `goals`, `goalsLoading`, `addGoal`) so existing hooks like `useGoals()` are unchanged.

## Data Flow

The API base URL (`VITE_API_URL`) may point to the main backend or a gateway that routes to multiple services; the frontend is unchanged in either case. See the root README **Architecture** for the technology flow.

1. User logs in → backend returns JWT → frontend stores token and sets user in AuthContext.
2. Protected app mounts → AppProviders mount → `QueryClientProvider` wraps feature providers. Each feature provider (e.g. TransactionProvider, GoalsProvider) uses `useQuery` to fetch its list (e.g. transactions, goals); the query key and API call live in the provider.
3. `request()` in [src/core/api/client.ts](src/core/api/client.ts) uses `VITE_API_URL` and attaches `Authorization: Bearer <token>`. API responses for transactions are parsed with Zod in [src/core/api/transactions.ts](src/core/api/transactions.ts).
4. Mutations (add/update/delete) use `useMutation` and on success update the query cache via `queryClient.setQueryData`, so the UI reflects changes without a refetch.
5. Pages and components consume context (e.g. `useTransactions()`, `useGoals()`) and call context actions to add/update/delete. Forms (TransactionModal, WorkoutModal, FoodEntryModal) use React Hook Form with Zod resolver for validation.

## Voice

[src/lib/voiceApi.ts](src/lib/voiceApi.ts) exposes `understand(text)`, which sends `POST /api/voice/understand` with the user’s utterance. The backend (Gemini) returns a list of actions (e.g. `add_schedule`, `add_transaction`). The frontend parses these into [VoiceAction](src/lib/voiceApi.ts) and the voice UI ([src/components/voice/VoiceAgentPanel.tsx](src/components/voice/VoiceAgentPanel.tsx)) applies them by calling the relevant context APIs (schedule, transactions, workouts, food, energy/check-in, goals).

## Subscription & Pro Features

The app uses a Free/Pro tier model. Pro features (voice, AI insights, AI food lookup) are gated in both the frontend and backend.

### Hook

`useSubscription()` from [src/hooks/useSubscription.ts](src/hooks/useSubscription.ts):

- `isPro` — `true` when `user.subscriptionStatus === 'pro'`
- `subscribe()` — calls `POST /api/subscription/checkout`, redirects to Stripe Checkout
- `manage()` — calls `POST /api/subscription/portal`, redirects to Stripe Customer Portal

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `UpgradePrompt` | `src/components/subscription/UpgradePrompt.tsx` | Reusable upgrade CTA (full card or compact). Shows when a free user accesses a Pro feature. |
| `SubscriptionSection` | `src/components/settings/SubscriptionSection.tsx` | Settings page section: current plan, upgrade/manage buttons. |
| `VoiceMicHero` | `src/components/voice/VoiceMicHero.tsx` | Dashboard voice mic button. Shows lock icon for free users. |
| `Pricing` | `src/pages/Pricing.tsx` | Public pricing page: Free vs Pro tier comparison. |
| `Landing` | `src/pages/Landing.tsx` | Public landing page at `/welcome`: hero, features, pricing, CTAs. |

### API

`src/core/api/subscription.ts`: `getStatus()`, `createCheckout()`, `createPortal()`.

## Theming

Settings store the theme (light / dark / system). Inside protected routes, [routes.tsx](src/routes.tsx) applies it in a `useEffect`: for “system” it uses `prefers-color-scheme`; otherwise it toggles the `dark` class on `document.documentElement` so Tailwind dark mode applies.

## Testing

- **Runner**: Vitest; **DOM**: jsdom; **components**: Testing Library.
- **Setup**: [src/setupTests.ts](src/setupTests.ts).
- Tests live next to source (e.g. `AppContext.test.tsx`, `TransactionContext.test.tsx`, `EnergyContext.test.tsx`, `WorkoutContext.test.tsx`, `GoalsContext.test.tsx`, `Body.test.tsx`, `Money.test.tsx`, `Energy.test.tsx`, `Groups.test.tsx`, `Home.test.tsx`, `Settings.test.tsx`) and in `components/shared/` (e.g. `EmptyState.test.tsx`, `SearchBar.test.tsx`), plus hooks and lib tests (`useDebounce.test.ts`, `useLocalStorage.test.ts`, `analytics.test.ts`, `validation.test.ts`, etc.).

Run: `npm run test` (or `test:ui` / `test:coverage`) from `frontend/` or `npm run test` from repo root.

## Vite and path alias

The project uses the `@` alias for `src/` (see [vite.config.ts](vite.config.ts)), so imports like `@/components/...` and `@/lib/...` resolve to `src/`.

## Changelog (latest first)

- **Update 18.0** — SaaS transformation: Landing page (`/welcome`), Pricing page (`/pricing`), `useSubscription()` hook, `UpgradePrompt` component, `SubscriptionSection` in Settings, `VoiceMicHero` dashboard component, Pro-gating on voice/insights, subscription API module, Capacitor mobile scripts.
- **Update 17.0** — AiInsightsSection: refresh button, thinking animations ("Analyzing your data…"); FoodEntryModal: trigger validation fix, liquid presets (can, bottle, 1L, 1.5L, 2L), solid presets (50g, 150g, 200g, 1 portion), "Look up with AI"; Money page: subtitle-only content ("Where does the money go?"); CSS: `animate-thinking-dots` keyframes. See root [CHANGELOG.md](../CHANGELOG.md).
- **Update 14.0** — Voice API now uses async polling: `voiceApi.ts` updated with `pollForResult()` helper. See root README **Update 14.0** and [UPDATE_14.0.md](../UPDATE_14.0.md).
- **Update 12.0** — Export documentation: [export.ts](src/lib/export.ts) and DataManagementSection/DataExportModal pass API-backed data (TanStack Query cache) to export functions. Backend received testing, security, observability, and migrations (see root README Update 12.0). See [UPDATE_12.0.md](../UPDATE_12.0.md).
- **Update 11.0** — Infrastructure, resilience & security audit (Layers 3, 4, 5). See root README **Update 11.0** and [UPDATE_11.0.md](../UPDATE_11.0.md).
- **Update 10.0** — Voice Live (JarvisLiveVisual, VoiceAgentPanel, voiceLiveApi), layout (AppSidebar, Base44Layout, TopBar, PageTitle), DashboardHero, Admin (AdminLogs, AdminUsersTable), shared UI (StatCard, SectionHeader, skeleton, tooltip). See root README **Update 10.0**.
- **Update 9.0** — Schedule recurrence, AppearanceSection, voice executor, schedule types. See root README **Update 9.0**.
- **Update 8.0** — FoodEntryModal, VoiceAgentButton/Panel, voiceActionExecutor, Energy page, voice schema. See root README **Update 8.0**.
- **Update 7.0** — Voice/food, dates, workouts, week, layout. See root README **Update 7.0**.
- **Update 6.2** — Dockerfile. See root README **Update 6.2**.
- **Update 6.1** — Docker. See root README **Update 6.1**.
- **Update 6.0** — dateRanges, useThemeEffect, TransactionContext, Docker; Zod, TanStack Query, React Hook Form. See root README **Update 6.0**.
- **Update 5.0** — Monorepo (frontend in `frontend/`). See root README **Update 5.0**.
- **Update 4.1** — Logo. See root README **Update 4.1**.
- **Update 4.0** — Feature modules (money, schedule, body, energy, goals), core API client, routes, AuthCallback, voice. See root README **Update 4.0**.
- **Update 3.0** — Auth, voice panel, API client, contexts. See root README **Update 3.0**.
- **Version 1.2** — Body, Energy, Home, Insights, Settings refactors; utils, BottomNav, settings types. See root README **Version 1.2**.
- **Version 1** — README. See root README **Version 1**.
