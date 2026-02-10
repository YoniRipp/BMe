/**
 * Express application factory. Does not listen.
 */
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './src/config/index.js';
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

// All API routes (auth, users, schedule, transactions, workouts, food, voice, etc.)
if (config.isDbConfigured) {
  app.use('/api', apiLimiter);
  app.use(apiRouter);
}

app.use(errorHandler);

export default app;
