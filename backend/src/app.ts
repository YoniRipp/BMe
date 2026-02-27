import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transactions.routes';
import workoutRoutes from './routes/workouts.routes';
import energyRoutes from './routes/energy.routes';
import scheduleRoutes from './routes/schedule.routes';
import goalRoutes from './routes/goals.routes';
import groupRoutes from './routes/groups.routes';
import userRoutes from './routes/users.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;