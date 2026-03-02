# BeMe Frontend — Technical Architecture

The frontend is a React 18 TypeScript SPA with TanStack Query for server state, Shadcn UI for components, and Capacitor for native mobile distribution.

---

## Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | React 18 | UI rendering |
| Language | TypeScript | Type safety |
| Build | Vite | Dev server + production bundling |
| Routing | React Router v6 | Client-side navigation, lazy-loaded pages |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | Shadcn UI (Radix) | Accessible, composable primitives |
| Icons | Lucide React | Icon library |
| Charts | Recharts | Data visualization |
| Dates | date-fns | Date formatting and manipulation |
| Server State | TanStack Query | useQuery, useMutation, cache management |
| Client State | React Context | Auth, app, notifications |
| Validation | Zod | Schema validation for forms and API responses |
| Forms | React Hook Form + @hookform/resolvers | Form state and Zod integration |
| Auth (Google) | @react-oauth/google | Google OAuth integration |
| Mobile | Capacitor | Native iOS/Android wrapper |
| Speech | @capacitor-community/speech-recognition | Native speech recognition |
| Testing | Vitest, Testing Library, jsdom | Unit and component testing |

---

## State Management

### Server State — TanStack Query

All server data (transactions, workouts, goals, schedule, food entries, check-ins) is managed via TanStack Query through feature providers:

```
QueryClientProvider
  └── TransactionProvider (useQuery for transactions list, useMutation for CRUD)
  └── WorkoutProvider
  └── EnergyProvider
  └── ScheduleProvider
  └── GoalsProvider
  └── GroupProvider
```

Each provider:
1. Fetches data with `useQuery` (keyed by query keys in `lib/queryClient.ts`)
2. Exposes `useMutation` for add/update/delete
3. Updates cache via `queryClient.setQueryData` on mutation success (optimistic or post-success)
4. Exposes a context hook (e.g. `useTransactions()`, `useGoals()`)

### Client State — React Context

| Context | Owns | Key |
|---------|------|-----|
| `AuthContext` | user, token, login/logout/register, subscriptionStatus | Global (wraps all routes) |
| `AppContext` | App-wide UI state | Inside protected routes |
| `NotificationContext` | Toast notifications | Inside protected routes |

### Provider Order

```
ErrorBoundary → ToastProvider → AuthProvider → Router
  └── (Public routes: /welcome, /login, /signup, /pricing, /auth/callback)
  └── (Protected routes):
        QueryClientProvider → AppProvider
          → TransactionProvider → WorkoutProvider → EnergyProvider
          → ScheduleProvider → GroupProvider → GoalsProvider
          → NotificationProvider → App content
```

---

## Routing

| Route | Access | Page |
|-------|--------|------|
| `/welcome` | Public | Landing page (unauthenticated redirect target) |
| `/login` | Public | Login |
| `/signup` | Public | Registration |
| `/pricing` | Public | Free vs Pro tier comparison |
| `/auth/callback` | Public | OAuth callback handler |
| `/` | Protected | Dashboard (Home) |
| `/money` | Protected | Transactions |
| `/body` | Protected | Workouts |
| `/energy` | Protected | Food entries + check-ins |
| `/groups` | Protected | Groups management |
| `/insights` | Protected (Pro) | AI-generated insights |
| `/settings` | Protected | User settings, subscription management |

All protected pages are lazy-loaded via `React.lazy()` + `Suspense`.

Unauthenticated users accessing protected routes are redirected to `/welcome`.

---

## Subscription & Pro Features

### Hook

`useSubscription()` from `hooks/useSubscription.ts`:

```typescript
const { isPro, subscriptionStatus, subscribe, manage } = useSubscription();
```

- `isPro` — `true` if `subscriptionStatus === 'pro'`
- `subscribe()` — redirects to Stripe Checkout
- `manage()` — redirects to Stripe Customer Portal

### Gated Features

| Feature | Component | Free Behavior |
|---------|-----------|---------------|
| Voice input | `VoiceMicHero`, `VoiceAgentButton` | Lock icon, "Upgrade to Pro" prompt |
| AI Insights | `Insights` page | `UpgradePrompt` shown |
| AI Food lookup | `FoodEntryModal` | Basic search only |

### Components

- `UpgradePrompt` — Reusable card/inline upgrade CTA. Props: `feature`, `compact`
- `SubscriptionSection` — Settings page section showing plan status and manage/upgrade buttons
- `Pricing` — Full pricing page with Free vs Pro comparison

---

## API Client

`src/core/api/client.ts`:

1. `getApiBase()` — returns `VITE_API_URL` or same-origin
2. `request<T>(path, options)` — fetch wrapper that:
   - Attaches `Authorization: Bearer <token>` from localStorage
   - Parses JSON response
   - On 401: clears token, dispatches `auth:logout` event → AuthContext clears user → redirect to login
3. Per-domain modules: `auth.ts`, `transactions.ts`, `schedule.ts`, `workouts.ts`, `food.ts`, `goals.ts`, `users.ts`, `subscription.ts`

---

## Voice

### Architecture

```
User taps mic (VoiceMicHero or VoiceAgentButton)
  → useSpeechRecognition() (Web Speech API or Capacitor native)
  → transcript text
  → voiceApi.understand(transcript) → POST /api/voice/understand
  → Gemini returns parsed actions
  → voiceActionExecutor applies actions via context APIs
  → TanStack Query cache invalidated → UI updates
  → Toast confirmation
```

### Components

- `VoiceMicHero` — Large dashboard mic button. Pro-gated. Shows listening/processing/done states.
- `VoiceAgentButton` — Floating mic button on all pages. Opens `VoiceAgentPanel`.
- `VoiceAgentPanel` — Slide-up panel with transcript display and action results.

### Speech Recognition

`useSpeechRecognition()` detects platform:
- **Web** — Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Native** — Capacitor `@capacitor-community/speech-recognition` plugin

Language: auto-detect (no hardcoded language).

---

## Mobile (Capacitor)

The same React SPA is wrapped for native distribution:

| Platform | Build |
|----------|-------|
| Android | `npm run build && npx cap sync android && npx cap open android` |
| iOS | `npm run build && npx cap sync ios && npx cap open ios` |

### Capacitor Config

```typescript
// capacitor.config.ts
{
  appId: 'com.beme.app',
  appName: 'BeMe',
  webDir: 'dist',
  server: { androidScheme: 'https' }
}
```

### Native Features

- **Speech recognition** — `@capacitor-community/speech-recognition`
- **Stripe checkout** — Opens in system browser (default Capacitor behavior)
- **PWA fallback** — Service worker via Workbox, offline caching, install prompt

---

## Theming

Settings store the theme preference: `light`, `dark`, or `system`.

Inside protected routes, `routes.tsx` applies the theme in a `useEffect`:
- `system` — uses `prefers-color-scheme` media query
- `light` / `dark` — toggles `dark` class on `document.documentElement`

Tailwind's `darkMode: 'class'` handles all dark mode styling.

---

## Testing

- **Runner**: Vitest
- **DOM**: jsdom
- **Components**: Testing Library (`@testing-library/react`)
- **Setup**: `src/setupTests.ts`

Tests live next to source files (e.g. `AppContext.test.tsx`, `Money.test.tsx`).

```bash
npm run test          # Run all tests
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
```
