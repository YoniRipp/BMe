import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePro } from './requirePro.js';

const mockQuery = vi.fn();

vi.mock('../config/index.js', () => ({
  config: {
    stripeSecretKey: 'sk_test_mock',
  },
}));

vi.mock('../db/pool.js', () => ({
  getPool: () => ({ query: mockQuery }),
}));

const { config } = await import('../config/index.js');

describe('requirePro', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: 'user-123' } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    (config as any).stripeSecretKey = 'sk_test_mock';
  });

  it('allows all access when Stripe is not configured', async () => {
    (config as any).stripeSecretKey = undefined;

    await requirePro(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when user is not authenticated', async () => {
    req.user = null;

    await requirePro(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user has pro subscription', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ subscription_status: 'pro' }],
    });

    await requirePro(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user has free subscription', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ subscription_status: 'free' }],
    });

    await requirePro(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Pro subscription required',
      upgradeUrl: '/pricing',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user has canceled subscription', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ subscription_status: 'canceled' }],
    });

    await requirePro(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user has past_due subscription', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ subscription_status: 'past_due' }],
    });

    await requirePro(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when subscription_status is null (defaults to free)', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ subscription_status: null }],
    });

    await requirePro(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(error) on database failure', async () => {
    const dbError = new Error('DB connection failed');
    mockQuery.mockRejectedValue(dbError);

    await requirePro(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
