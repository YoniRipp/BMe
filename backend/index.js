/**
 * Application entry point. Loads config, initializes DB, starts server.
 */
import { config } from './src/config/index.js';
import { initSchema } from './src/db/index.js';
import { closePool } from './src/db/pool.js';
import { createApp } from './app.js';
import { closeRedis } from './src/redis/client.js';
import { closeQueue } from './src/queue/index.js';
import { startVoiceWorker } from './src/workers/voice.js';
import { subscribe, startEventsWorker, closeEventsBus } from './src/events/bus.js';
import { logger } from './src/lib/logger.js';

subscribe('money.TransactionCreated', (event) => {
  logger.info({ eventType: event.type, eventId: event.eventId, userId: event.metadata?.userId }, 'Event received');
});

async function start() {
  // Initialize database if configured - exit on failure since API requires it
  if (config.isDbConfigured) {
    try {
      await initSchema();
      logger.info('Database schema initialized');
    } catch (e) {
      logger.error({ err: e }, 'Database init failed - exiting');
      process.exit(1);
    }
  }
  const app = await createApp();
  const server = app.listen(config.port, config.host || '0.0.0.0', () => {
    logger.info({ port: config.port, host: config.host || '0.0.0.0' }, 'BMe backend listening');
  });

  let voiceWorker = null;
  if (config.isRedisConfigured) {
    voiceWorker = startVoiceWorker();
    logger.info('Voice worker started');
  }
  // Event bus consumer runs in a separate process (workers/event-consumer.js)

  // Legacy: Live voice WebSocket - commented out
  // Voice now uses: Browser Web Speech API → text → POST /api/voice/understand → Gemini
  //
  // const wss = new WebSocketServer({ noServer: true });
  //
  // server.on('upgrade', (request, socket, head) => {
  //   const url = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`);
  //   if (url.pathname !== '/api/voice/live') {
  //     socket.destroy();
  //     return;
  //   }
  //   const token = url.searchParams.get('token') ?? request.headers['sec-websocket-protocol']?.split(',').map((s) => s.trim()).find((s) => s.startsWith('bearer-'))?.slice(7);
  //   if (!token) {
  //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  //     socket.destroy();
  //     return;
  //   }
  //   let userId;
  //   try {
  //     if (config.mcpSecret && config.mcpUserId && token === config.mcpSecret) {
  //       userId = config.mcpUserId;
  //     } else {
  //       const payload = jwt.verify(token, config.jwtSecret);
  //       userId = payload.sub;
  //     }
  //   } catch (e) {
  //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  //     socket.destroy();
  //     return;
  //   }
  //   wss.handleUpgrade(request, socket, head, (ws) => {
  //     wss.emit('connection', ws, request, userId);
  //   });
  // });
  //
  // wss.on('connection', (ws, request, userId) => {
  //   attachLiveSession(ws, userId).catch((e) => {
  //     logger.error({ err: e }, 'Voice Live attach failed');
  //     if (ws.readyState === ws.OPEN) ws.close(1011, 'Server error');
  //   });
  // });

  async function shutdown() {
    let exitCode = 0;

    // Wait for HTTP server to close properly
    await new Promise((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });

    // Close voice worker with error handling
    if (voiceWorker) {
      try {
        await voiceWorker.close();
        logger.info('Voice worker closed');
      } catch (e) {
        logger.error({ err: e }, 'Failed to close voice worker');
        exitCode = 1;
      }
    }

    // Close each resource with individual error handling
    try {
      await closeEventsBus();
    } catch (e) {
      logger.error({ err: e }, 'Failed to close events bus');
      exitCode = 1;
    }

    try {
      await closeQueue();
    } catch (e) {
      logger.error({ err: e }, 'Failed to close queue');
      exitCode = 1;
    }

    try {
      await closePool();
    } catch (e) {
      logger.error({ err: e }, 'Failed to close database pool');
      exitCode = 1;
    }

    try {
      await closeRedis();
    } catch (e) {
      logger.error({ err: e }, 'Failed to close Redis');
      exitCode = 1;
    }

    process.exit(exitCode);
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((e) => {
  logger.error({ err: e }, 'Start failed');
  process.exit(1);
});
