import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from './auth.js';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../config/index.js', () => ({
  config: {
    jwtSecret: 'test-secret',
    mcpSecret: null,
    mcpUserId: null,
  },
}));

const jwt = (await import('jsonwebtoken')).default;
const { config } = await import('../config/index.js');

describe('requireAuth', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    config.mcpSecret = null;
    config.mcpUserId = null;
  });

  it('returns 401 when Authorization header is missing', () => {
    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer ', () => {
    req.headers.authorization = 'Basic xyz';
    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid or expired', () => {
    req.headers.authorization = 'Bearer invalid-token';
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    requireAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches user when token is valid', () => {
    req.headers.authorization = 'Bearer valid-token';
    jwt.verify.mockReturnValue({
      sub: 'user-123',
      email: 'user@example.com',
      role: 'user',
    });

    requireAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      role: 'user',
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
