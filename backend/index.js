/**
 * Application entry point. Loads config, initializes DB, starts server.
 */
import { config } from './src/config/index.js';
import { isDbConfigured, initSchema } from './src/db/index.js';
import { closePool } from './src/db/pool.js';
import app from './app.js';
import { logger } from './src/lib/logger.js';
import { WebSocketServer } from 'ws';
import { attachLiveSession } from './src/services/voiceLive.js';
import jwt from 'jsonwebtoken';

async function start() {
  if (config.isDbConfigured) {
    try {
      await initSchema();
      logger.info('Database schema initialized');
    } catch (e) {
      logger.error({ err: e }, 'Database init failed');
    }
  }
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'BMe backend listening');
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`);
    if (url.pathname !== '/api/voice/live') {
      socket.destroy();
      return;
    }
    const token = url.searchParams.get('token') ?? request.headers['sec-websocket-protocol']?.split(',').map((s) => s.trim()).find((s) => s.startsWith('bearer-'))?.slice(7);
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    let userId;
    try {
      if (config.mcpSecret && config.mcpUserId && token === config.mcpSecret) {
        userId = config.mcpUserId;
      } else {
        const payload = jwt.verify(token, config.jwtSecret);
        userId = payload.sub;
      }
    } catch (e) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, userId);
    });
  });

  wss.on('connection', (ws, request, userId) => {
    attachLiveSession(ws, userId).catch((e) => {
      logger.error({ err: e }, 'Voice Live attach failed');
      if (ws.readyState === ws.OPEN) ws.close(1011, 'Server error');
    });
  });

  async function shutdown() {
    server.close(() => {
      logger.info('HTTP server closed');
    });
    await closePool();
    process.exit(0);
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((e) => {
  logger.error({ err: e }, 'Start failed');
  process.exit(1);
});
