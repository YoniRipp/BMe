/**
 * Express application factory. Does not listen.
 * Exports async createApp() to support optional Redis-backed rate limiting.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createProxyMiddleware } from 'http-proxy-middleware';
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
  app.set('trust proxy', 1);
  const corsOrigin = config.corsOrigin;
  const corsOptions = { origin: corsOrigin };
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
  app.use('/api/auth/google', authLimiter);
  app.use('/api/auth/facebook', authLimiter);
  app.use('/api/auth/twitter', authLimiter);

  // Request logging (skip health checks to reduce noise)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path !== '/health' && req.path !== '/ready') {
        logger.info({ method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start });
      }
    });
    next();
  });

  // Apply rate limiter to all /api routes BEFORE proxy and API router
  app.use('/api', apiLimiter);

  // API gateway: route context paths to extracted services when SERVICE_URL is set
  if (config.moneyServiceUrl) {
    app.use('/api/money', createProxyMiddleware({ target: config.moneyServiceUrl, changeOrigin: true, pathRewrite: { '^/api/money': '/api' } }));
    app.use('/api/transactions', createProxyMiddleware({ target: config.moneyServiceUrl, changeOrigin: true }));
    app.use('/api/balance', createProxyMiddleware({ target: config.moneyServiceUrl, changeOrigin: true }));
  }
  if (config.scheduleServiceUrl) {
    app.use('/api/schedule', createProxyMiddleware({ target: config.scheduleServiceUrl, changeOrigin: true }));
  }
  if (config.bodyServiceUrl) {
    app.use('/api/workouts', createProxyMiddleware({ target: config.bodyServiceUrl, changeOrigin: true }));
  }
  if (config.energyServiceUrl) {
    app.use('/api/food-entries', createProxyMiddleware({ target: config.energyServiceUrl, changeOrigin: true }));
    app.use('/api/daily-check-ins', createProxyMiddleware({ target: config.energyServiceUrl, changeOrigin: true }));
  }
  if (config.goalsServiceUrl) {
    app.use('/api/goals', createProxyMiddleware({ target: config.goalsServiceUrl, changeOrigin: true }));
  }

  // All API routes (auth, users, schedule, transactions when not proxied, workouts, food, voice, etc.)
  if (config.isDbConfigured) {
    app.use(apiRouter);
  }

  app.use(errorHandler);

  return app;
}
