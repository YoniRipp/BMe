# BeMe - Life Management Application

A comprehensive lifestyle management application built with React, TypeScript, and Tailwind CSS. Track your finances, fitness, wellness, and collaborate with groups - all in one beautiful, modern interface.

## Features

### 🏠 Dashboard (Home)
- Financial summary with balance, income, and expenses
- Daily schedule management
- Quick stats (workouts, energy level, savings rate)
- Quick navigation to all life areas

### 💰 Money
- Income and expense tracking
- Monthly balance visualization
- Interactive charts for financial trends
- Transaction categorization
- Recurring transaction support
- Filter by income/expense/all

### 💪 Body
- Workout logging with exercise details
- Weekly workout streak tracking
- Duration and exercise set/rep tracking
- Multiple workout types (strength, cardio, flexibility, sports)
- Average sleep tracking

### ⚡ Energy
- Daily wellness check-ins
- Sleep hours and quality tracking
- Calorie tracking (consumed/burned)
- Energy and stress level monitoring
- Mood tracking
- Interactive charts for trends

### 👥 Groups
- Create and manage collaborative groups
- Household, event, and project group types
- Member management
- Group settings and invitations (placeholder)

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **State Management**: React Context API
- **Data Persistence**: LocalStorage

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
cd BMe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
BMe/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components (TopBar, BottomNav, Layout)
│   │   ├── shared/         # Shared components (PageHeader, EmptyState, etc.)
│   │   ├── ui/             # Shadcn UI components
│   │   ├── money/          # Money feature components
│   │   ├── body/           # Body/fitness feature components
│   │   ├── energy/         # Energy/wellness feature components
│   │   ├── home/           # Home dashboard components
│   │   └── groups/         # Groups feature components
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and constants
│   ├── pages/              # Page components (Home, Money, Body, Energy, Groups)
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
└── package.json
```

## Features in Detail

### Data Persistence
All data is stored in the browser's LocalStorage, so your data persists across sessions. Sample data is loaded on first use.

### Mock User
The app uses a mock user (Jonathan) - no authentication required. This is perfect for personal use or as a starting point for adding real authentication later.

### Responsive Design
The app is fully responsive and works great on both desktop and mobile devices.

### Sample Data
The app comes pre-loaded with sample data including:
- Sample transactions
- Sample workouts
- Sample energy check-ins
- Sample schedule items

### Backend (optional)

To run the backend (voice agent, food search, data API, auth), set in `backend/.env`:

- `DATABASE_URL` – PostgreSQL connection string (e.g. Supabase). Required for data API, food search, voice add_food, and auth.
- `GEMINI_API_KEY` – for voice intent parsing.
- `JWT_SECRET` – secret for signing JWTs (defaults to a dev value; set in production).

**Social login (Google, Facebook, Twitter):**

- **Backend** (`backend/.env`): `GOOGLE_CLIENT_ID` (required for Google; use the same value as in the frontend), `FACEBOOK_APP_ID`, `TWITTER_CLIENT_ID`; for Twitter redirect flow also `TWITTER_CLIENT_SECRET`, `TWITTER_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/twitter/callback`), and `FRONTEND_ORIGIN` (e.g. `http://localhost:5173`). If `GOOGLE_CLIENT_ID` is missing, the backend returns 503 for `POST /api/auth/google`.
- **Frontend** (project root `.env`): `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID` (same values as in backend). Restart the dev server after changing these.

Food search and voice “add food” use the USDA Foundation Foods database stored in Supabase. One-time import: place `FoodData_Central_foundation_food_json_2025-12-18.json` in the project root and run `npm run import:foods` from the `backend` directory (or `node backend/scripts/importFoundationFoods.js` from the repo root).

## Future Enhancements

- Real authentication system
- Backend API integration
- Cloud data sync
- Mobile app (React Native)
- Data export/import
- Advanced analytics and insights
- Goal tracking and progress monitoring
- Group collaboration features (shared expenses, tasks)
- Notification system
- Dark mode

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
