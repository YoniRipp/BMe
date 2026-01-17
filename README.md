# BeMe - Life Management Application

A comprehensive full-stack lifestyle management application with JWT authentication. Track your finances, fitness, wellness, and collaborate with groups - all in one beautiful, modern interface.

## 🌟 Features

### 🏠 Dashboard (Home)
- Financial summary with balance, income, and expenses
- Daily schedule management
- Quick stats (workouts, energy level, savings rate)
- Quick navigation to all life areas

### 💰 Money (Transactions)
- Income and expense tracking
- Monthly balance visualization
- Interactive charts for financial trends
- Transaction categorization
- Recurring transaction support
- Filter by income/expense/all
- Financial statistics and insights

### 💪 Body (Workouts)
- Workout logging with exercise details
- Weekly workout streak tracking
- Duration and exercise set/rep tracking
- Multiple workout types (strength, cardio, flexibility, sports)
- Exercise notes and weight tracking

### ⚡ Energy & Wellness
- Daily wellness check-ins
- Sleep hours and quality tracking
- Calorie tracking (consumed/burned)
- Energy and stress level monitoring (1-5 scale)
- Mood tracking
- Food entry logging with macronutrients
- Interactive charts for trends

### 📅 Schedule
- Daily schedule management
- Time-blocked activities
- Category-based organization
- Active/inactive status
- Group schedule support

### 🎯 Goals
- Set goals for calories, workouts, and savings
- Weekly, monthly, and yearly goal periods
- Progress tracking

### 👥 Groups (Collaboration)
- Create and manage collaborative groups
- Household, event, and project group types
- Member management with roles (admin/member)
- Group invitations system
- Shared transactions and schedules

### 🔐 Authentication & Security
- User registration and login
- Secure password hashing (bcrypt)
- JWT token-based authentication
- Refresh token rotation
- Protected routes
- Session management with httpOnly cookies

## 🛠️ Tech Stack

### Frontend
- **React** 18 with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** v6 - Client-side routing
- **Shadcn UI** - Beautiful UI components (Radix UI)
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **Node.js** 20+ with TypeScript
- **Express** 4.18+ - Web framework
- **PostgreSQL** 15+ - Relational database
- **Prisma** ORM - Type-safe database access
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **Morgan** - HTTP request logger

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 15 or higher ([Download](https://www.postgresql.org/download/)) OR **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

Verify installations:
```bash
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
```

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd BMe
```

### Step 2: Set Up Database

You have two options for the database:

#### Option A: Using Docker (Recommended - Easiest)

1. Make sure Docker Desktop is installed and running

2. Start PostgreSQL container:
```bash
cd backend
docker compose up -d postgres
```

This creates a PostgreSQL container on port 5432 with:
- Database: `beme_dev`
- User: `beme`
- Password: `beme_dev_password`

3. Verify it's running:
```bash
docker ps
```

You should see `backend-postgres-1` container with status "healthy".

#### Option B: Local PostgreSQL Installation

1. Install PostgreSQL from [postgresql.org/download](https://www.postgresql.org/download/)

2. Create database:
```bash
psql -U postgres
CREATE DATABASE beme_dev;
CREATE USER beme WITH PASSWORD 'beme_dev_password';
GRANT ALL PRIVILEGES ON DATABASE beme_dev TO beme;
\q
```

Or use default postgres user:
```bash
psql -U postgres
CREATE DATABASE beme_dev;
\q
```

### Step 3: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**

Create `.env` file in `backend/` directory:

**For Docker:**
```env
DATABASE_URL="postgresql://beme:beme_dev_password@localhost:5432/beme_dev"
```

**For local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/beme_dev"
```

**Complete `.env` file:**
```env
# Database URL
DATABASE_URL="postgresql://beme:beme_dev_password@localhost:5432/beme_dev"

# JWT Secrets (IMPORTANT: Generate secure secrets!)
# Run these commands to generate:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-32-character-minimum-secret-key-here"
JWT_REFRESH_SECRET="your-32-character-minimum-refresh-secret-here"

# Server Configuration
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"

# Token Expiration (optional)
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

**Generate JWT secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the outputs into your `.env` file.

4. **Set up database schema:**

**Option 1: Using db push (Recommended for development):**
```bash
npx prisma db push
npm run db:generate
```

**Option 2: Using migrations:**
```bash
npm run db:migrate
npm run db:generate
```

5. **(Optional) Seed database with test data:**
```bash
npm run db:seed
```

This creates a test account:
- **Email:** `test@example.com`
- **Password:** `password123`

### Step 4: Frontend Setup

1. **Navigate back to root directory:**
```bash
cd ..
```

2. **Install dependencies:**
```bash
npm install
```

3. **(Optional) Create frontend environment file:**

Create `.env` file in root directory:
```env
VITE_API_URL=http://localhost:3000/api
```

If you skip this, it defaults to `http://localhost:3000/api`.

## ▶️ How to Run

### Development Mode

You need to run **both** the backend and frontend servers in separate terminals.

#### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
Server is running on port 3000
Environment: development
CORS origin: http://localhost:5173
```

The backend API will be available at `http://localhost:3000`

#### Terminal 2 - Frontend Server

```bash
# Make sure you're in the root directory (not backend)
npm run dev
```

**Expected output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend will be available at `http://localhost:5173`

### Access the Application

1. Open your browser
2. Navigate to: **http://localhost:5173**
3. You should see the login page

### First Time Login

**Option 1: Use Seeded Test Account** (if you ran `npm run db:seed`)
- Email: `test@example.com`
- Password: `password123`

**Option 2: Create New Account**
1. Click "Sign up" or navigate to `/signup`
2. Fill in the form:
   - Name
   - Email
   - Password (minimum 8 characters)
3. Click "Create account"
4. You'll be automatically logged in and redirected to the dashboard

## 📝 Available Scripts

### Backend Scripts (run from `backend/` directory)

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript for production
npm start            # Start production server
npm run db:migrate   # Create and apply database migrations
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database (dev)
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (database GUI)
npm test             # Run tests
npm run lint         # Type check TypeScript
```

### Frontend Scripts (run from root directory)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm test             # Run tests
npm run lint         # Type check TypeScript
```

## 📡 API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- All endpoints require authentication unless specified

### Authentication Endpoints

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
- Sets httpOnly cookie with access token
- Returns user data and refresh token in body

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- Sets httpOnly cookie with access token
- Returns user data and refresh token in body

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

**Response:** Returns new access token (set in httpOnly cookie)

#### Get Current User
```http
GET /api/auth/me
Cookie: accessToken=your-access-token
```

**Response:** Returns current user data

### Transaction Endpoints

```http
GET    /api/transactions              # Get all transactions
GET    /api/transactions/:id          # Get transaction by ID
POST   /api/transactions              # Create transaction
PUT    /api/transactions/:id          # Update transaction
DELETE /api/transactions/:id          # Delete transaction
GET    /api/transactions/stats        # Get statistics
```

**Example - Create Transaction:**
```json
{
  "date": "2025-01-17",
  "type": "expense",
  "amount": 50.00,
  "category": "Food",
  "description": "Groceries",
  "isRecurring": false
}
```

### Workout Endpoints

```http
GET    /api/workouts          # Get all workouts
GET    /api/workouts/:id      # Get workout by ID
POST   /api/workouts          # Create workout
PUT    /api/workouts/:id      # Update workout
DELETE /api/workouts/:id      # Delete workout
```

**Example - Create Workout:**
```json
{
  "date": "2025-01-17",
  "title": "Morning Run",
  "type": "cardio",
  "durationMinutes": 30,
  "exercises": [
    {
      "name": "Running",
      "sets": 1,
      "reps": 1
    }
  ],
  "notes": "Great workout!"
}
```

### Energy Endpoints

```http
# Check-ins
GET    /api/energy/checkins          # Get all check-ins
GET    /api/energy/checkins/:id      # Get check-in by ID
POST   /api/energy/checkins          # Create check-in
PUT    /api/energy/checkins/:id      # Update check-in
DELETE /api/energy/checkins/:id      # Delete check-in

# Food entries
GET    /api/energy/food          # Get all food entries
GET    /api/energy/food/:id      # Get food entry by ID
POST   /api/energy/food          # Create food entry
PUT    /api/energy/food/:id      # Update food entry
DELETE /api/energy/food/:id      # Delete food entry
```

### Schedule Endpoints

```http
GET    /api/schedule          # Get all schedule items
GET    /api/schedule/:id      # Get schedule item by ID
POST   /api/schedule          # Create schedule item
PUT    /api/schedule/:id      # Update schedule item
DELETE /api/schedule/:id      # Delete schedule item
```

### Goals Endpoints

```http
GET    /api/goals          # Get all goals
GET    /api/goals/:id      # Get goal by ID
POST   /api/goals          # Create goal
PUT    /api/goals/:id      # Update goal
DELETE /api/goals/:id      # Delete goal
```

### Groups Endpoints

```http
GET    /api/groups                          # Get all groups
GET    /api/groups/:id                      # Get group by ID
POST   /api/groups                          # Create group
PUT    /api/groups/:id                      # Update group
DELETE /api/groups/:id                      # Delete group
POST   /api/groups/:id/invite               # Invite member
PUT    /api/groups/:id/members/:memberId/role  # Update member role
DELETE /api/groups/:id/members/:memberId    # Remove member
```

### User Settings Endpoints

```http
GET    /api/users/settings    # Get user settings
PUT    /api/users/settings    # Update user settings
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## 🗄️ Database Management

### Using Prisma Studio

View and edit your database with a GUI:

```bash
cd backend
npm run db:studio
```

Opens at `http://localhost:5555`

### Reset Database (⚠️ Deletes All Data)

```bash
cd backend

# Option 1: Using Prisma
npx prisma migrate reset
npm run db:seed  # Re-seed if needed

# Option 2: Using db push
npx prisma db push --force-reset
npm run db:seed
```

### Create New Migration

After changing `prisma/schema.prisma`:

```bash
cd backend
npm run db:migrate
npm run db:generate
```

Or for development (faster, no migration files):
```bash
npx prisma db push
npm run db:generate
```

## 🔧 Troubleshooting

### Issue: Docker Desktop Not Running

**Error:** `unable to get image` or `connection refused`

**Solution:**
1. Open Docker Desktop application
2. Wait until it shows "Docker Desktop is running" in system tray
3. Verify: `docker ps` should work without errors

### Issue: Database Connection Error

**Error:** `Can't reach database server` or `Connection refused`

**Solutions:**
1. **If using Docker:**
   ```bash
   cd backend
   docker compose up -d postgres
   # Wait 10-20 seconds for database to start
   ```

2. **If using local PostgreSQL:**
   - Check PostgreSQL is running (system services)
   - Verify database exists: `psql -l | grep beme_dev`
   - Check credentials in `.env` match your PostgreSQL user

3. **Test connection:**
   ```bash
   docker exec -it backend-postgres-1 psql -U beme -d beme_dev
   # Or for local:
   psql $DATABASE_URL
   ```

### Issue: Environment Variable Not Found

**Error:** `Environment variable not found: DATABASE_URL`

**Solution:**
1. Ensure `.env` file exists in `backend/` directory
2. Verify `.env` file has all required variables
3. Check for typos in variable names
4. Make sure `.env` file is in the correct location

### Issue: Prisma Advisory Lock Timeout

**Error:** `Timed out trying to acquire a postgres advisory lock`

**Solutions:**
1. Restart PostgreSQL container:
   ```bash
   docker restart backend-postgres-1
   ```

2. Use `db push` instead of `migrate`:
   ```bash
   npx prisma db push
   ```

3. Close Prisma Studio if it's open
4. Check for other Prisma processes running

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
1. **Windows:**
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Mac/Linux:**
   ```bash
   lsof -ti:3000 | xargs kill
   ```

3. Or change port in `backend/.env`:
   ```env
   PORT=3001
   ```
   Update `CORS_ORIGIN` and frontend `.env` if needed

### Issue: JWT Secret Too Short

**Error:** `JWT_SECRET must be at least 32 characters`

**Solution:**
Generate a longer secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy output to `.env` file.

### Issue: Frontend Can't Connect to Backend

**Error:** CORS errors or 401 errors

**Solutions:**
1. Verify backend is running: Check `http://localhost:3000/health`
2. Check `CORS_ORIGIN` in `backend/.env` matches frontend URL
3. Clear browser cache and cookies
4. Check browser console (F12) for specific errors
5. Verify `VITE_API_URL` in frontend `.env` (if set)

### Issue: Module Not Found Errors

**Error:** Various "Cannot find module" errors

**Solution:**
```bash
# Clean install - root directory
rm -rf node_modules package-lock.json
npm install

# Clean install - backend directory
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Authentication Not Working

**Symptoms:** Can't login, stuck on login page

**Solutions:**
1. Check backend logs for errors
2. Verify JWT secrets are set correctly in `.env`
3. Clear browser cookies for localhost
4. Check browser console for errors
5. Verify refresh token is stored in localStorage (F12 → Application → Local Storage)

## 🏗️ Production Build

### Build Backend

```bash
cd backend
npm run build
npm start
```

The built files will be in `backend/dist/` directory.

### Build Frontend

```bash
# From root directory
npm run build
```

The built files will be in `dist/` directory.

To preview the production build:
```bash
npm run preview
```

### Production Environment Variables

Make sure to set proper values for production:

**Backend `.env`:**
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@host:5432/beme_prod"
JWT_SECRET="strong-production-secret-minimum-32-chars"
JWT_REFRESH_SECRET="strong-production-refresh-secret"
CORS_ORIGIN="https://your-domain.com"
```

**Frontend `.env`:**
```env
VITE_API_URL=https://api.your-domain.com/api
```

## 🐳 Docker Deployment

### Start PostgreSQL with Docker

```bash
cd backend
docker compose up -d postgres
```

### Stop Docker Services

```bash
cd backend
docker compose down
```

### View Docker Logs

```bash
docker logs backend-postgres-1
```

## 📂 Project Structure

```
BMe/
├── backend/                          # Backend API server
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   │   ├── env.ts              # Environment validation
│   │   │   ├── database.ts         # Prisma client
│   │   │   └── cors.ts             # CORS config
│   │   ├── controllers/            # Route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── transactions.controller.ts
│   │   │   └── ...
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validator.middleware.ts
│   │   │   └── rateLimiter.ts
│   │   ├── routes/                 # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── transactions.routes.ts
│   │   │   └── ...
│   │   ├── services/               # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   └── ...
│   │   ├── types/                  # TypeScript types
│   │   ├── utils/                  # Utilities
│   │   ├── app.ts                  # Express app setup
│   │   └── server.ts               # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   ├── migrations/             # Migration files
│   │   └── seed.ts                 # Seed script
│   ├── tests/                      # Test files
│   ├── .env                        # Environment variables (gitignored)
│   ├── docker-compose.yml          # Docker configuration
│   ├── Dockerfile                  # Docker image
│   └── package.json
│
├── src/                             # Frontend React application
│   ├── components/
│   │   ├── auth/                   # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/                 # Layout components
│   │   ├── ui/                     # UI components (Shadcn)
│   │   ├── money/                  # Money feature components
│   │   ├── body/                   # Workout components
│   │   ├── energy/                 # Energy/wellness components
│   │   ├── home/                   # Dashboard components
│   │   ├── groups/                 # Groups components
│   │   └── shared/                 # Shared components
│   ├── context/                    # React Context providers
│   │   ├── AuthContext.tsx         # Authentication context
│   │   ├── AppContext.tsx          # App context
│   │   ├── TransactionContext.tsx  # Transactions context
│   │   └── ...
│   ├── hooks/                      # Custom React hooks
│   ├── lib/
│   │   ├── api/                    # API client
│   │   │   └── client.ts          # Axios instance
│   │   └── ...                     # Utilities
│   ├── pages/                      # Page components
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Home.tsx
│   │   └── ...
│   ├── types/                      # TypeScript types
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
│
├── public/                          # Static assets
├── .env                            # Frontend environment variables
├── package.json                    # Frontend dependencies
└── README.md                       # This file
```

## 🔐 Security Features

- **Password Hashing:** bcrypt with 12 salt rounds
- **JWT Authentication:** Access tokens (15 min) and refresh tokens (7 days)
- **httpOnly Cookies:** Prevents XSS attacks
- **Rate Limiting:** Protects against brute force attacks
- **CORS Configuration:** Controlled cross-origin requests
- **Helmet:** Security headers protection
- **Input Validation:** Zod schema validation on all inputs
- **SQL Injection Prevention:** Prisma ORM parameterized queries

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `refresh_tokens` - Refresh token storage
- `transactions` - Financial transactions
- `workouts` - Workout logs
- `energy_checkins` - Daily wellness check-ins
- `food_entries` - Food/nutrition entries
- `schedule_items` - Daily schedule items
- `goals` - User goals
- `groups` - Collaborative groups
- `group_members` - Group membership
- `group_invitations` - Group invitations
- `user_settings` - User preferences

See `backend/prisma/schema.prisma` for complete schema definition.

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Docker/PostgreSQL is running
- [ ] Backend `.env` file is configured correctly
- [ ] Database schema is created (`npm run db:push` or `db:migrate`)
- [ ] Prisma client is generated (`npm run db:generate`)
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access frontend at http://localhost:5173
- [ ] Can create a new account
- [ ] Can login with credentials
- [ ] Can access protected routes (dashboard, etc.)
- [ ] API calls work (check browser Network tab)

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Tests

```bash
npm test
npm run test:ui
npm run test:coverage
```

## 📚 Additional Resources

- [Backend API Documentation](backend/README.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Getting Help

If you encounter issues:

1. Check error messages in the terminal
2. Check browser console (F12) for frontend errors
3. Verify all prerequisites are installed
4. Ensure database is running and accessible
5. Verify `.env` files are configured correctly
6. Review the troubleshooting section above
7. Check if ports 3000 and 5173 are available
8. Verify Docker Desktop is running (if using Docker)

## 🎯 Next Steps

Once everything is running:

1. ✅ Explore the application features
2. ✅ Check out the API endpoints using Postman or browser dev tools
3. ✅ Review the code structure
4. ✅ Customize for your needs
5. ✅ Deploy to production

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Happy coding! 🎉**

For detailed backend API documentation, see [backend/README.md](backend/README.md).
