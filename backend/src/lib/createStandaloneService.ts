/**
 * Factory for standalone extracted services (Body, Energy, Goals).
 * Eliminates the duplicated Express boilerplate across service entrypoints.
 */
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { requestIdMiddleware } from '../middleware/requestId.js';
import { logger } from './logger.js';

interface StandaloneServiceOptions {
  name: string;
  context: string;
  portEnvVar: string;
  routers: Router[];
}

export function createStandaloneService(options: StandaloneServiceOptions) {
  const { name, context, portEnvVar, routers } = options;
  const app = express();
  const port = process.env[portEnvVar] || config.port;

  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(helmet({ crossOriginOpenerPolicy: false }));
  app.use(express.json({ limit: '10mb' }));
  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/ready', async (_req, res) => {
    try {
      await getPool(context).query('SELECT 1');
      res.status(200).json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'not ready', reason: 'Database unreachable' });
    }
  });

  for (const router of routers) {
    app.use(router);
  }

  app.use(errorHandler);
  app.listen(port, () => logger.info({ port, service: name }, `${name} service listening`));

  return app;
}
