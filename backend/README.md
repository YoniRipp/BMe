# BeMe Backend API

Node.js + Express + PostgreSQL + Prisma backend API for BeMe application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your database URL and JWT secrets:
```
DATABASE_URL="postgresql://user:password@localhost:5432/beme_dev"
JWT_SECRET="your-32-char-secret-key-minimum-required"
JWT_REFRESH_SECRET="your-refresh-token-secret-key-minimum"
CORS_ORIGIN="http://localhost:5173"
```

4. Setup database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed database (optional):
```bash
npm run db:seed
```

6. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats` - Get statistics

### Workouts
- `GET /api/workouts` - Get all workouts
- `GET /api/workouts/:id` - Get workout by ID
- `POST /api/workouts` - Create workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Energy
- `GET /api/energy/checkins` - Get all check-ins
- `POST /api/energy/checkins` - Create check-in
- `PUT /api/energy/checkins/:id` - Update check-in
- `DELETE /api/energy/checkins/:id` - Delete check-in
- `GET /api/energy/food` - Get all food entries
- `POST /api/energy/food` - Create food entry
- `PUT /api/energy/food/:id` - Update food entry
- `DELETE /api/energy/food/:id` - Delete food entry

### Schedule, Goals, Groups, Settings
Similar RESTful patterns for all resources.

## Development

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:studio` - Open Prisma Studio
- `npm test` - Run tests

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)
- `JWT_EXPIRES_IN` - Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: 7d)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production/test)