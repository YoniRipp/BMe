import { beforeEach, describe, expect, it, vi } from 'vitest';
import { idempotencyMiddleware } from './idempotency.js';

vi.mock('../lib/keyValueStore.js', () => ({
  kvGet: vi.fn(),
  kvSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/logger.js', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

const { kvGet, kvSet } = await import('../lib/keyValueStore.js');

function makeReq(userId: string, body: Record<string, unknown>) {
  return {
    body,
    method: 'POST',
    baseUrl: '',
    path: '/api/food-entries',
    route: { path: '/api/food-entries' },
    user: { id: userId },
    get: vi.fn((name: string) => name === 'X-Idempotency-Key' ? 'same-key' : undefined),
  } as any;
}

function makeRes() {
  return {
    statusCode: 201,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

describe('idempotencyMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(kvGet).mockResolvedValue(null);
  });

  it('scopes cache keys by user', async () => {
    const nextA = vi.fn();
    const resA = makeRes();
    await idempotencyMiddleware(makeReq('user-a', { name: 'Eggs' }), resA, nextA);
    resA.json({ id: 'entry-a' });

    const nextB = vi.fn();
    const resB = makeRes();
    await idempotencyMiddleware(makeReq('user-b', { name: 'Eggs' }), resB, nextB);
    resB.json({ id: 'entry-b' });

    expect(nextA).toHaveBeenCalled();
    expect(nextB).toHaveBeenCalled();
    expect(vi.mocked(kvSet).mock.calls[0][0]).not.toBe(vi.mocked(kvSet).mock.calls[1][0]);
  });

  it('rejects same scoped key reused with a different body', async () => {
    const next = vi.fn();
    const res = makeRes();
    await idempotencyMiddleware(makeReq('user-a', { name: 'Eggs' }), res, next);
    res.json({ id: 'entry-a' });

    const cachedPayload = vi.mocked(kvSet).mock.calls[0][1] as string;
    vi.mocked(kvGet).mockResolvedValue(cachedPayload);

    const conflictRes = makeRes();
    await idempotencyMiddleware(makeReq('user-a', { name: 'Toast' }), conflictRes, vi.fn());

    expect(conflictRes.status).toHaveBeenCalledWith(409);
    expect(conflictRes.json).toHaveBeenCalledWith({
      error: {
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'Idempotency key was already used with a different request body',
      },
    });
  });
});
