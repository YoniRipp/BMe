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

### Installation and run

**Frontend**

1. Clone the repository and go to the frontend:
```bash
cd BMe
cd frontend
npm install
npm run dev
```

Or from the repo root: `npm run dev` (runs the frontend dev server).

2. Open your browser at `http://localhost:5173`.

**Backend (optional)**

From the repo root:
```bash
cd backend
npm install
npm start
```

Or from repo root: `npm run start:backend`. For dev with auto-reload: `npm run dev:backend`.

### Building for Production

From the frontend folder:
```bash
cd frontend
npm run build
```

Or from repo root: `npm run build`. The built files will be in `frontend/dist`.

### Preview Production Build

```bash
cd frontend && npm run preview
```

Or from repo root: `npm run preview`.

## Project Structure

```
BMe/
├── backend/                 # Node/Express API, auth, DB, voice, MCP
│   ├── src/                 # Controllers, services, models, routes, db
│   ├── routes/             # Auth and user routes
│   ├── scripts/             # e.g. importFoundationFoods.js
│   └── package.json
├── frontend/                # React/Vite app
│   ├── src/
│   │   ├── components/     # Reusable UI (layout, shared, ui, money, body, energy, home, groups)
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and constants
│   │   ├── pages/          # Page components (Home, Money, Body, Energy, Groups, etc.)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── core/           # API client and feature APIs
│   │   ├── features/       # Feature-specific modules
│   │   ├── App.tsx         # Main app and routing
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── README.md
├── .gitignore
└── FoodData_Central_foundation_food_json_2025-12-18.json   # For backend import script
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
- **Frontend** (`frontend/.env`): `VITE_API_URL` (backend URL, e.g. `https://your-backend.up.railway.app` or `http://localhost:3000`), `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID` (same values as in backend). Restart the frontend dev server after changing these.

Food search and voice “add food” use the USDA Foundation Foods database stored in Supabase. One-time import: place `FoodData_Central_foundation_food_json_2025-12-18.json` in the **project root** and run `npm run import:foods` from the `backend` directory (or `node backend/scripts/importFoundationFoods.js` from the repo root).

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
