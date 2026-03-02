/**
 * Subscription routes — Stripe checkout, portal, status, and webhook.
 */
import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';
import * as subscriptionService from '../services/subscription.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Checkout: create a Stripe Checkout Session and return the URL
router.post('/api/subscription/checkout', requireAuth, async (req: any, res: any, next: any) => {
  try {
    if (!config.stripeSecretKey || !config.stripePriceId) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }
    const frontendOrigin = config.frontendOrigin || 'http://localhost:5173';
    const successUrl = `${frontendOrigin}/settings?subscription=success`;
    const cancelUrl = `${frontendOrigin}/pricing?subscription=canceled`;
    const url = await subscriptionService.createCheckoutSession(
      req.user.id,
      req.user.email,
      successUrl,
      cancelUrl,
    );
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

// Portal: create a Stripe Customer Portal session
router.post('/api/subscription/portal', requireAuth, async (req: any, res: any, next: any) => {
  try {
    if (!config.stripeSecretKey) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }
    const customerId = await subscriptionService.getOrCreateStripeCustomer(
      req.user.id,
      req.user.email,
    );
    const returnUrl = `${config.frontendOrigin || 'http://localhost:5173'}/settings`;
    const url = await subscriptionService.createPortalSession(customerId, returnUrl);
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

// Status: return current subscription status
router.get('/api/subscription/status', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const sub = await subscriptionService.getUserSubscription(req.user.id);
    res.json(sub || { status: 'free', currentPeriodEnd: null });
  } catch (e) {
    next(e);
  }
});

export default router;

/**
 * Stripe webhook handler. Must be mounted with express.raw() body parser
 * BEFORE express.json() in app.ts.
 */
export function createWebhookRouter() {
  const webhookRouter = Router();

  webhookRouter.post('/api/webhooks/stripe', async (req, res) => {
    if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
      return res.status(503).json({ error: 'Stripe webhooks not configured' });
    }

    const stripe = new Stripe(config.stripeSecretKey);
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } catch (err) {
      logger.error({ err }, 'Stripe webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
      await subscriptionService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      logger.error({ err, eventType: event.type }, 'Webhook handler error');
      res.status(500).json({ error: 'Webhook handler error' });
    }
  });

  return webhookRouter;
}
