/**
 * Subscription service — Stripe integration for BeMe Pro.
 */
import Stripe from 'stripe';
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';
import { logger } from '../lib/logger.js';

function getStripe(): Stripe {
  if (!config.stripeSecretKey) {
    throw new Error('Stripe is not configured (missing STRIPE_SECRET_KEY)');
  }
  return new Stripe(config.stripeSecretKey);
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [userId],
  );
  if (rows[0]?.stripe_customer_id) {
    return rows[0].stripe_customer_id;
  }
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await pool.query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, userId],
  );
  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId, email);
  if (!config.stripePriceId) {
    throw new Error('STRIPE_PRICE_ID is not configured');
  }
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });
  return session.url!;
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
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
  stripeCustomerId: string,
  status: string,
  subscriptionId: string | null,
  periodEnd: Date | null,
) {
  const pool = getPool();
  await pool.query(
    `UPDATE users
     SET subscription_status = $1,
         subscription_id = $2,
         subscription_current_period_end = $3
     WHERE stripe_customer_id = $4`,
    [status, subscriptionId, periodEnd, stripeCustomerId],
  );
}

export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.customer && session.subscription) {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await updateSubscriptionStatus(
          session.customer as string,
          'pro',
          subscription.id,
          new Date(subscription.current_period_end * 1000),
        );
        logger.info({ customerId: session.customer, subscriptionId: subscription.id }, 'Subscription activated');
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === 'active' ? 'pro'
        : subscription.status === 'past_due' ? 'past_due'
        : subscription.status === 'canceled' ? 'canceled'
        : 'free';
      await updateSubscriptionStatus(
        subscription.customer as string,
        status,
        subscription.id,
        new Date(subscription.current_period_end * 1000),
      );
      logger.info({ customerId: subscription.customer, status }, 'Subscription updated');
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionStatus(
        subscription.customer as string,
        'canceled',
        subscription.id,
        new Date(subscription.current_period_end * 1000),
      );
      logger.info({ customerId: subscription.customer }, 'Subscription canceled');
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer && invoice.subscription) {
        await updateSubscriptionStatus(
          invoice.customer as string,
          'past_due',
          invoice.subscription as string,
          null,
        );
        logger.warn({ customerId: invoice.customer }, 'Payment failed');
      }
      break;
    }
    default:
      break;
  }
}
