/**
 * Express application factory. Does not listen.
 * Exports async createApp() to support optional Redis-backed rate limiting.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { config } from './src/config/index.js';
import { getRedisClient, isRedisConfigured } from './src/redis/client.js';
import apiRouter from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/lib/logger.js';

const apiLimiterBase = {
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
};

const authLimiterBase = {
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
};

if (!config.geminiApiKey) {
  logger.warn('GEMINI_API_KEY is not set. Voice /understand endpoint will return an error.');
}
if (!config.isDbConfigured) {
  logger.warn('DATABASE_URL is not set. Data API and MCP require a database.');
}

export async function createApp() {
  let apiLimiter;
  let authLimiter;

  if (config.isRedisConfigured) {
    const client = await getRedisClient();
    const redisStoreConfig = {
      sendCommand: (...args) => client.sendCommand(args),
    };
    apiLimiter = rateLimit({
      ...apiLimiterBase,
      store: new RedisStore(redisStoreConfig),
    });
    authLimiter = rateLimit({
      ...authLimiterBase,
      store: new RedisStore(redisStoreConfig),
    });
  } else {
    apiLimiter = rateLimit(apiLimiterBase);
    authLimiter = rateLimit(authLimiterBase);
  }

  const app = express();
  const corsOrigin = config.corsOrigin;
  const corsOptions =
    process.env.NODE_ENV === 'production'
      ? {
          origin: (origin, cb) => {
            const allowed = String(corsOrigin || '').trim();
            if (!origin) return cb(null, true);
            if (allowed && origin === allowed) return cb(null, true);
            // Allow any *.up.railway.app when CORS_ORIGIN is also Railway (resilient to URL changes)
            if (allowed && /\.up\.railway\.app$/.test(allowed) && /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(origin)) {
              return cb(null, true);
            }
            // Fallback: allow any *.up.railway.app in production (for Railway when CORS_ORIGIN unset)
            if (/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(origin)) {
              return cb(null, true);
            }
            return cb(null, false);
          },
        }
      : {
          origin:
            corsOrigin === 'http://localhost:5173'
              ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176']
              : corsOrigin,
        };
  app.use(cors(corsOptions));
  logger.info({ corsOrigin: config.corsOrigin, nodeEnv: process.env.NODE_ENV }, 'CORS configured');
  app.use(helmet({ crossOriginOpenerPolicy: false }));
  app.use(express.json({ limit: '10mb' }));

  // Health (not rate-limited)
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  // Ready: 200 if DB (and Redis when configured) reachable, 503 otherwise (not rate-limited)
  app.get('/ready', async (req, res) => {
    if (!config.isDbConfigured) {
      return res.status(503).json({ status: 'not ready', reason: 'Database not configured' });
    }
    try {
      const { getPool } = await import('./src/db/index.js');
      const pool = getPool();
      await pool.query('SELECT 1');
    } catch (e) {
      return res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
    }
    if (isRedisConfigured()) {
      try {
        const redis = await getRedisClient();
        await redis.ping();
      } catch (e) {
        return res.status(503).json({ status: 'not ready', reason: 'Redis unreachable' });
      }
    }
    res.status(200).json({ status: 'ok' });
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

  return app;
}
