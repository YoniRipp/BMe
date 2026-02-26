/**
 * Standalone Energy service (food entries, daily check-ins). Uses ENERGY_DATABASE_URL or DATABASE_URL.
 * Run: node energy-service.js (uses PORT or ENERGY_SERVICE_PORT)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './src/config/index.js';
import { getPool } from './src/db/pool.js';
import foodEntryRouter from './src/routes/foodEntry.js';
import dailyCheckInRouter from './src/routes/dailyCheckIn.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/lib/logger.js';

const app = express();
const port = process.env.ENERGY_SERVICE_PORT || config.port;
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    await getPool('energy').query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
  }
});
app.use(foodEntryRouter);
app.use(dailyCheckInRouter);
app.use(errorHandler);
app.listen(port, () => logger.info({ port }, 'Energy service listening'));
