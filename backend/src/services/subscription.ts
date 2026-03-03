/**
 * Subscription service — Lemon Squeezy integration for BeMe Pro.
 */
import crypto from 'crypto';
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';
import { logger } from '../lib/logger.js';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

async function lsFetch(path: string, options: RequestInit = {}) {
  if (!config.lemonSqueezyApiKey) {
    throw new Error('Lemon Squeezy is not configured (missing LEMONSQUEEZY_API_KEY)');
  }
  const res = await fetch(`${LS_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${config.lemonSqueezyApiKey}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lemon Squeezy API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: 'monthly' | 'annual',
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const variantId = plan === 'annual'
    ? config.lemonSqueezyVariantIdAnnual
    : config.lemonSqueezyVariantId;

  if (!variantId || !config.lemonSqueezyStoreId) {
    throw new Error('Lemon Squeezy variant/store IDs are not configured');
  }

  const data = await lsFetch('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { user_id: userId },
          },
          checkout_options: {
            redirect_url: successUrl,
          },
          product_options: {
            redirect_url: successUrl,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: config.lemonSqueezyStoreId } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    }),
  });

  return data.data.attributes.url;
}

export async function getCustomerPortalUrl(userId: string): Promise<string | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT ls_customer_portal_url FROM users WHERE id = $1',
    [userId],
  );
  return rows[0]?.ls_customer_portal_url || null;
}

export async function getUserSubscription(userId: string) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT subscription_status, subscription_current_period_end FROM users WHERE id = $1',
    [userId],
  );
  if (rows.length === 0) return null;
  return {
    status: rows[0].subscription_status || 'free',
    currentPeriodEnd: rows[0].subscription_current_period_end,
  };
}

export async function updateSubscriptionStatus(
  userId: string,
  status: string,
  subscriptionId: string | null,
  periodEnd: Date | null,
  customerPortalUrl: string | null = null,
) {
  const pool = getPool();
  await pool.query(
    `UPDATE users
     SET subscription_status = $1,
         ls_subscription_id = $2,
         subscription_current_period_end = $3,
         ls_customer_portal_url = COALESCE($4, ls_customer_portal_url)
     WHERE id = $5`,
    [status, subscriptionId, periodEnd, customerPortalUrl, userId],
  );
}

async function findUserByLsCustomerId(lsCustomerId: string): Promise<string | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE ls_customer_id = $1',
    [lsCustomerId],
  );
  return rows[0]?.id || null;
}

export function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!config.lemonSqueezyWebhookSecret) return false;
  const hmac = crypto
    .createHmac('sha256', config.lemonSqueezyWebhookSecret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return false;
  }
}

export async function handleWebhookEvent(event: any) {
  const eventName: string = event.meta?.event_name;
  const attrs = event.data?.attributes;
  if (!eventName || !attrs) return;

  const customData = event.meta?.custom_data || attrs.first_order_item?.custom_data;
  const userId = customData?.user_id;
  const lsCustomerId = String(attrs.customer_id || '');
  const lsSubscriptionId = String(event.data?.id || '');
  const customerPortalUrl: string | null = attrs.urls?.customer_portal || null;

  let resolvedUserId = userId;
  if (!resolvedUserId && lsCustomerId) {
    resolvedUserId = await findUserByLsCustomerId(lsCustomerId);
  }

  if (!resolvedUserId) {
    logger.warn({ eventName, lsCustomerId }, 'Webhook: could not resolve user ID');
    return;
  }

  if (lsCustomerId) {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET ls_customer_id = $1 WHERE id = $2 AND (ls_customer_id IS NULL OR ls_customer_id = $1)',
      [lsCustomerId, resolvedUserId],
    );
  }

  const lsStatus: string = attrs.status || '';
  const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null;
  const endsAt = attrs.ends_at ? new Date(attrs.ends_at) : null;
  const periodEnd = renewsAt || endsAt;

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed': {
      await updateSubscriptionStatus(resolvedUserId, 'pro', lsSubscriptionId, periodEnd, customerPortalUrl);
      logger.info({ userId: resolvedUserId, lsSubscriptionId }, `Subscription ${eventName}`);
      break;
    }
    case 'subscription_updated': {
      const status = lsStatus === 'active' ? 'pro'
        : lsStatus === 'past_due' ? 'past_due'
        : lsStatus === 'paused' || lsStatus === 'cancelled' || lsStatus === 'expired' ? 'canceled'
        : 'free';
      await updateSubscriptionStatus(resolvedUserId, status, lsSubscriptionId, periodEnd, customerPortalUrl);
      logger.info({ userId: resolvedUserId, status, lsStatus }, 'Subscription updated');
      break;
    }
    case 'subscription_cancelled':
    case 'subscription_expired': {
      await updateSubscriptionStatus(resolvedUserId, 'canceled', lsSubscriptionId, periodEnd, customerPortalUrl);
      logger.info({ userId: resolvedUserId }, `Subscription ${eventName}`);
      break;
    }
    case 'subscription_payment_failed': {
      await updateSubscriptionStatus(resolvedUserId, 'past_due', lsSubscriptionId, periodEnd, customerPortalUrl);
      logger.warn({ userId: resolvedUserId }, 'Payment failed');
      break;
    }
    case 'subscription_payment_success': {
      await updateSubscriptionStatus(resolvedUserId, 'pro', lsSubscriptionId, periodEnd, customerPortalUrl);
      break;
    }
    default:
      logger.debug({ eventName }, 'Unhandled webhook event');
      break;
  }
}
