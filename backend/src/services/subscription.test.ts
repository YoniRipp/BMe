import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();

vi.mock('../config/index.js', () => ({
  config: {
    lemonSqueezyApiKey: 'test_key',
    lemonSqueezyWebhookSecret: 'test_webhook_secret',
    lemonSqueezyStoreId: 'store_1',
    lemonSqueezyVariantId: 'variant_monthly',
    lemonSqueezyVariantIdAnnual: 'variant_annual',
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
    debug: vi.fn(),
  },
}));

const { getUserSubscription, updateSubscriptionStatus, handleWebhookEvent, verifyWebhookSignature } =
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

      await updateSubscriptionStatus('user-123', 'pro', 'sub_ls_123', new Date('2026-04-01'));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['pro', 'sub_ls_123', expect.any(Date), null, 'user-123'],
      );
    });
  });

  describe('handleWebhookEvent', () => {
    it('activates subscription on subscription_created', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await handleWebhookEvent({
        meta: { event_name: 'subscription_created', custom_data: { user_id: 'user-123' } },
        data: {
          id: 'sub_ls_456',
          attributes: {
            status: 'active',
            customer_id: 'cus_ls_789',
            renews_at: '2026-04-01T00:00:00Z',
            urls: { customer_portal: 'https://portal.example.com' },
          },
        },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['pro', 'sub_ls_456']),
      );
    });

    it('cancels subscription on subscription_cancelled', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await handleWebhookEvent({
        meta: { event_name: 'subscription_cancelled', custom_data: { user_id: 'user-123' } },
        data: {
          id: 'sub_ls_456',
          attributes: {
            status: 'cancelled',
            customer_id: 'cus_ls_789',
            ends_at: '2026-04-01T00:00:00Z',
          },
        },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['canceled', 'sub_ls_456']),
      );
    });

    it('sets past_due on subscription_payment_failed', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await handleWebhookEvent({
        meta: { event_name: 'subscription_payment_failed', custom_data: { user_id: 'user-123' } },
        data: {
          id: 'sub_ls_456',
          attributes: {
            status: 'past_due',
            customer_id: 'cus_ls_789',
          },
        },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['past_due', 'sub_ls_456']),
      );
    });

    it('ignores events without user ID or customer ID', async () => {
      await handleWebhookEvent({
        meta: { event_name: 'subscription_created' },
        data: {
          id: 'sub_ls_456',
          attributes: { status: 'active' },
        },
      });

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('verifies valid signature', () => {
      const crypto = require('crypto');
      const body = '{"test": true}';
      const hmac = crypto.createHmac('sha256', 'test_webhook_secret').update(body).digest('hex');

      expect(verifyWebhookSignature(body, hmac)).toBe(true);
    });

    it('rejects invalid signature', () => {
      expect(verifyWebhookSignature('{"test": true}', 'invalid_hex')).toBe(false);
    });
  });
});
