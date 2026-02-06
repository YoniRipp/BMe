/**
 * Express application factory. Does not listen.
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './src/config/index.js';
import * as authRoutes from './routes/auth.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import * as userRoutes from './routes/users.js';
import apiRouter from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});

if (!config.geminiApiKey) {
  console.warn('GEMINI_API_KEY is not set. Voice /understand endpoint will return an error.');
}
if (!config.isDbConfigured) {
  console.warn('DATABASE_URL is not set. Data API and MCP require a database.');
}

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Auth and API routes
if (config.isDbConfigured) {
  app.post('/api/auth/register', authRoutes.register);
  app.post('/api/auth/login', authRoutes.login);
  app.post('/api/auth/google', authRoutes.loginGoogle);
  app.post('/api/auth/facebook', authRoutes.loginFacebook);
  app.post('/api/auth/twitter', authRoutes.loginTwitter);
  app.get('/api/auth/twitter/redirect', authRoutes.twitterRedirect);
  app.get('/api/auth/twitter/callback', authRoutes.twitterCallback);
  app.get('/api/auth/me', requireAuth, authRoutes.me);

  app.get('/api/users', requireAuth, requireAdmin, userRoutes.listUsers);
  app.post('/api/users', requireAuth, requireAdmin, userRoutes.createUser);
  app.patch('/api/users/:id', requireAuth, requireAdmin, userRoutes.updateUser);
  app.delete('/api/users/:id', requireAuth, requireAdmin, userRoutes.deleteUser);
}

// MVC routes (schedule, transactions, workouts, food-entries, daily-check-ins, goals, food/search, voice)
app.use('/api', apiLimiter);
app.use(apiRouter);

app.use(errorHandler);

export default app;
