import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();

vi.mock('../config/index.js', () => ({
  config: {
    stripeSecretKey: 'sk_test_mock',
    stripePriceId: 'price_test_mock',
  },
}));

vi.mock('../db/pool.js', () => ({
  getPool: () => ({ query: mockQuery }),
}));

vi.mock('../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Stripe — provide class-like constructor mock
const mockStripeInstance = {
  customers: {
    create: vi.fn().mockResolvedValue({ id: 'cus_mock123' }),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/mock' }),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/mock' }),
    },
  },
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    }),
  },
};

function MockStripe() {
  return mockStripeInstance;
}

vi.mock('stripe', () => ({
  default: MockStripe,
}));

const { getUserSubscription, updateSubscriptionStatus, handleWebhookEvent } =
  await import('./subscription.js');

describe('subscription service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserSubscription', () => {
    it('returns subscription status from DB', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ subscription_status: 'pro', subscription_current_period_end: '2026-04-01T00:00:00Z' }],
      });

      const result = await getUserSubscription('user-123');

      expect(result).toEqual({
        status: 'pro',
        currentPeriodEnd: '2026-04-01T00:00:00Z',
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('subscription_status'),
        ['user-123'],
      );
    });

    it('returns null when user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getUserSubscription('nonexistent');

      expect(result).toBeNull();
    });

    it('defaults to free when subscription_status is null', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ subscription_status: null, subscription_current_period_end: null }],
      });

      const result = await getUserSubscription('user-123');

      expect(result).toEqual({ status: 'free', currentPeriodEnd: null });
    });
  });

  describe('updateSubscriptionStatus', () => {
    it('updates DB with new status', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await updateSubscriptionStatus('cus_123', 'pro', 'sub_123', new Date('2026-04-01'));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['pro', 'sub_123', expect.any(Date), 'cus_123'],
      );
    });
  });

  describe('handleWebhookEvent', () => {
    it('activates subscription on checkout.session.completed', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await handleWebhookEvent({
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            customer: 'cus_123',
            subscription: 'sub_123',
          },
        },
      } as any);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['pro', 'sub_mock123', expect.any(Date), 'cus_123']),
      );
    });

    it('cancels subscription on customer.subscription.deleted', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await handleWebhookEvent({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_123',
            id: 'sub_123',
            current_period_end: Math.floor(Date.now() / 1000),
          },
        },
      } as any);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['canceled', 'sub_123']),
      );
    });

    it('sets past_due on invoice.payment_failed', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await handleWebhookEvent({
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
          },
        },
      } as any);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['past_due', 'sub_123']),
      );
    });

    it('ignores unknown event types', async () => {
      await handleWebhookEvent({
        type: 'some.unknown.event',
        data: { object: {} },
      } as any);

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
