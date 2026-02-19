/**
 * Express application factory. Does not listen.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './src/config/index.js';
import apiRouter from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/lib/logger.js';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
});

if (!config.geminiApiKey) {
  logger.warn('GEMINI_API_KEY is not set. Voice /understand endpoint will return an error.');
}
if (!config.isDbConfigured) {
  logger.warn('DATABASE_URL is not set. Data API and MCP require a database.');
}

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet());
app.use(express.json());

// Health (not rate-limited)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Ready: 200 if DB reachable, 503 otherwise (not rate-limited)
app.get('/ready', async (req, res) => {
  if (!config.isDbConfigured) {
    return res.status(503).json({ status: 'not ready', reason: 'Database not configured' });
  }
  try {
    const { getPool } = await import('./src/db/index.js');
    const pool = getPool();
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
  }
});

// Auth routes: stricter rate limit (10 per 15 min)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// All API routes (auth, users, schedule, transactions, workouts, food, voice, etc.)
if (config.isDbConfigured) {
  app.use('/api', apiLimiter);
  app.use(apiRouter);
}

app.use(errorHandler);

export default app;
