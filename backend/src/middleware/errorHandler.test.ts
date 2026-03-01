/**
 * Error handler middleware — asyncHandler, domain errors, PG 23505, headersSent.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  asyncHandler,
  errorHandler,
} from './errorHandler.js';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../errors.js';

vi.mock('../lib/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

function createApp(routeFn: express.RequestHandler) {
  const app = express();
  app.use(express.json());
  app.all('/test', routeFn);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  const env = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  describe('asyncHandler', () => {
    it('forwards thrown errors to error handler', async () => {
      const app = createApp(
        asyncHandler(async () => {
          throw new Error('Something broke');
        })
      );

      const res = await request(app).get('/test').expect(500);

      expect(res.body.error).toBe('Something broke');
    });

    it('passes through when handler succeeds', async () => {
      const app = createApp(
        asyncHandler(async (req, res) => {
          res.json({ ok: true });
        })
      );

      const res = await request(app).get('/test').expect(200);

      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('domain errors', () => {
    it('ValidationError maps to 400', async () => {
      const app = createApp(
        asyncHandler(async () => {
          throw new ValidationError('Invalid input');
        })
      );

      const res = await request(app).get('/test').expect(400);

      expect(res.body.error).toBe('Invalid input');
    });

    it('NotFoundError maps to 404', async () => {
      const app = createApp(
        asyncHandler(async () => {
          throw new NotFoundError('Resource not found');
        })
      );

      const res = await request(app).get('/test').expect(404);

      expect(res.body.error).toBe('Resource not found');
    });

    it('UnauthorizedError maps to 401', async () => {
      const app = createApp(
        asyncHandler(async () => {
          throw new UnauthorizedError('Not authenticated');
        })
      );

      const res = await request(app).get('/test').expect(401);

      expect(res.body.error).toBe('Not authenticated');
    });

    it('ConflictError maps to 409', async () => {
      const app = createApp(
        asyncHandler(async () => {
          throw new ConflictError('Already exists');
        })
      );

      const res = await request(app).get('/test').expect(409);

      expect(res.body.error).toBe('Already exists');
    });

    it('ForbiddenError maps to 403', async () => {
      const app = createApp(
        asyncHandler(async () => {
          throw new ForbiddenError('Access denied');
        })
      );

      const res = await request(app).get('/test').expect(403);

      expect(res.body.error).toBe('Access denied');
    });
  });

  describe('PG 23505 (unique violation)', () => {
    it('maps to 409 with email message when constraint includes email', async () => {
      const app = createApp(
        asyncHandler(async () => {
          const e = new Error('duplicate key');
          (e as Error & { code?: string; constraint?: string }).code = '23505';
          (e as Error & { code?: string; constraint?: string }).constraint = 'users_email_key';
          throw e;
        })
      );

      const res = await request(app).get('/test').expect(409);

      expect(res.body.error).toBe('Email already registered');
    });

    it('maps to 409 with generic message when constraint does not include email', async () => {
      const app = createApp(
        asyncHandler(async () => {
          const e = new Error('duplicate key');
          (e as Error & { code?: string; constraint?: string }).code = '23505';
          (e as Error & { code?: string; constraint?: string }).constraint = 'some_other_unique';
          throw e;
        })
      );

      const res = await request(app).get('/test').expect(409);

      expect(res.body.error).toBe('A record with this value already exists');
    });
  });

  describe('headersSent', () => {
    it('calls next(err) when headers already sent', async () => {
      const nextFn = vi.fn();
      const res = {
        headersSent: true,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const req = {};
      const err = new Error('test');

      errorHandler(err, req as express.Request, res as unknown as express.Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
