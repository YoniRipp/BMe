/**
 * Auth routes: register, login, validation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../config/index.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    googleClientId: null,
    facebookAppId: null,
    twitterClientId: null,
  },
}));

const mockPoolQuery = vi.fn();
vi.mock('../db/index.js', () => ({
  getPool: () => ({ query: mockPoolQuery }),
}));

vi.mock('../events/publish.js', () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/keyValueStore.js', () => ({
  kvGet: vi.fn(),
  kvSet: vi.fn(),
  kvDelete: vi.fn(),
}));

const mockBcryptHash = vi.fn();
const mockBcryptCompare = vi.fn();
vi.mock('bcrypt', () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
    compare: (...args: unknown[]) => mockBcryptCompare(...args),
  },
}));

const mockJwtSign = vi.fn();
const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: (...args: unknown[]) => mockJwtSign(...args),
    verify: (...args: unknown[]) => mockJwtVerify(...args),
  },
}));

vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'user-1', email: 'user@test.com', role: 'user' };
    next();
  },
}));

import authRouter from './auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authRouter);
  return app;
}

describe('auth routes', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBcryptHash.mockResolvedValue('hashed-password');
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('signed-jwt-token');
    mockPoolQuery.mockResolvedValue({ rows: [] }); // default: empty
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'ValidPass1', name: 'Test User' })
        .expect(400);

      expect(res.body.error).toBe('email is required');
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short', name: 'Test User' })
        .expect(400);

      expect(res.body.error).toBe('password must be at least 8 characters');
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when password lacks uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'lowercase1', name: 'Test User' })
        .expect(400);

      expect(res.body.error).toBe(
        'password must contain at least one uppercase letter, one lowercase letter, and one digit'
      );
    });

    it('returns 400 when password lacks lowercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'UPPERCASE1', name: 'Test User' })
        .expect(400);

      expect(res.body.error).toBe(
        'password must contain at least one uppercase letter, one lowercase letter, and one digit'
      );
    });

    it('returns 400 when password lacks digit', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'NoDigitsHere', name: 'Test User' })
        .expect(400);

      expect(res.body.error).toBe(
        'password must contain at least one uppercase letter, one lowercase letter, and one digit'
      );
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'ValidPass1' })
        .expect(400);

      expect(res.body.error).toBe('name is required');
    });

    it('returns 201 with user and token on success', async () => {
      const row = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2025-02-24T12:00:00.000Z',
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [row] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'Test@Example.COM', password: 'ValidPass1', name: 'Test User' })
        .expect(201);

      expect(res.body.user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: '2025-02-24T12:00:00.000Z',
      });
      expect(res.body.token).toBe('signed-jwt-token');
      expect(mockBcryptHash).toHaveBeenCalledWith('ValidPass1', 10);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'hashed-password', 'Test User']
      );
      expect(mockJwtSign).toHaveBeenCalledWith(
        { sub: 'user-123', email: 'test@example.com', role: 'user' },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('returns 409 when email already registered', async () => {
      mockPoolQuery.mockRejectedValueOnce({ code: '23505', constraint: 'users_email_key' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'ValidPass1', name: 'Test User' })
        .expect(409);

      expect(res.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'ValidPass1' })
        .expect(400);

      expect(res.body.error).toBe('email and password are required');
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(res.body.error).toBe('email and password are required');
    });

    it('returns 401 when user not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'ValidPass1' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 401 when password does not match', async () => {
      const row = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        password_hash: 'hashed-password',
        auth_provider: null,
        provider_id: null,
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [row] });
      mockBcryptCompare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 401 when account uses social sign-in (no password_hash)', async () => {
      const row = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        password_hash: null,
        auth_provider: 'google',
        provider_id: 'google-123',
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [row] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'AnyPassword' })
        .expect(401);

      expect(res.body.error).toBe(
        'This account uses social sign-in. Sign in with your provider instead.'
      );
    });

    it('returns 200 with user and token on success', async () => {
      const row = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        password_hash: 'hashed-password',
        auth_provider: null,
        provider_id: null,
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [row] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'Test@Example.COM', password: 'ValidPass1' })
        .expect(200);

      expect(res.body.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });
      expect(res.body.token).toBe('signed-jwt-token');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with user when authenticated', async () => {
      const row = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'user',
        created_at: '2025-02-24T12:00:00.000Z',
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [row] });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(res.body).toMatchObject({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'user',
      });
    });

    it('returns 404 when user not found in DB', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });
});
