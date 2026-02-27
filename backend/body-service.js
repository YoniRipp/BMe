/**
 * Standalone Body service (workouts). Exposes workout API only; uses BODY_DATABASE_URL or DATABASE_URL.
 * Run: node body-service.js (uses PORT or BODY_SERVICE_PORT)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './src/config/index.js';
import { getPool } from './src/db/pool.js';
import workoutRouter from './src/routes/workout.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/lib/logger.js';

const app = express();
const port = process.env.BODY_SERVICE_PORT || config.port;
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    await getPool('body').query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
  }
});
app.use(workoutRouter);
app.use(errorHandler);
app.listen(port, () => logger.info({ port }, 'Body service listening'));
