/**
 * Standalone Goals service. Exposes goals API only; uses GOALS_DATABASE_URL or DATABASE_URL.
 * Run: node goals-service.js (uses PORT or GOALS_SERVICE_PORT)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './src/config/index.js';
import { getPool } from './src/db/pool.js';
import goalRouter from './src/routes/goal.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/lib/logger.js';

const app = express();
const port = process.env.GOALS_SERVICE_PORT || config.port;
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    await getPool('goals').query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
  }
});
app.use(goalRouter);
app.use(errorHandler);
app.listen(port, () => logger.info({ port }, 'Goals service listening'));
