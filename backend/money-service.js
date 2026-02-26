/**
 * Standalone Money service. Exposes transaction API only; uses MONEY_DATABASE_URL or DATABASE_URL.
 * Run when deploying Money as a separate service. Main app proxies to this when MONEY_SERVICE_URL is set.
 *
 * Run: node money-service.js (uses PORT or MONEY_SERVICE_PORT)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './src/config/index.js';
import { getPool } from './src/db/pool.js';
import transactionRouter from './src/routes/transaction.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/lib/logger.js';

const app = express();
const port = process.env.MONEY_SERVICE_PORT || config.port;

app.use(cors({ origin: config.corsOrigin }));
app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    const pool = getPool('money');
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
  }
});

app.use(transactionRouter);
app.use(errorHandler);

app.listen(port, () => {
  logger.info({ port }, 'Money service listening');
});
