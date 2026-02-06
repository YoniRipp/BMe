/**
 * Application entry point. Loads config, initializes DB, starts server.
 */
import { config } from './src/config/index.js';
import { isDbConfigured, initSchema } from './src/db/index.js';
import { closePool } from './src/db/pool.js';
import app from './app.js';

async function start() {
  if (config.isDbConfigured) {
    try {
      await initSchema();
      console.log('Database schema initialized.');
    } catch (e) {
      console.error('Database init failed:', e?.message ?? e);
    }
  }
  const server = app.listen(config.port, () => {
    console.log(`BMe backend listening on http://localhost:${config.port}`);
  });

  async function shutdown() {
    server.close(() => {
      console.log('HTTP server closed.');
    });
    await closePool();
    process.exit(0);
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((e) => {
  console.error('Start failed:', e);
  process.exit(1);
});
