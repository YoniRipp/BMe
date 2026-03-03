/**
 * Subscription routes — Lemon Squeezy checkout, portal, status, and webhook.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';
import * as subscriptionService from '../services/subscription.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.post('/api/subscription/checkout', requireAuth, async (req: any, res: any, next: any) => {
  try {
    if (!config.lemonSqueezyApiKey || !config.lemonSqueezyVariantId) {
      return res.status(503).json({ error: 'Payments are not configured' });
    }
    const plan = req.body?.plan === 'annual' ? 'annual' : 'monthly';
    const frontendOrigin = config.frontendOrigin || 'http://localhost:5173';
    const successUrl = `${frontendOrigin}/settings?subscription=success`;
    const cancelUrl = `${frontendOrigin}/pricing?subscription=canceled`;
    const url = await subscriptionService.createCheckoutSession(
      req.user.id,
      req.user.email,
      plan as 'monthly' | 'annual',
      successUrl,
      cancelUrl,
    );
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

router.post('/api/subscription/portal', requireAuth, async (req: any, res: any, next: any) => {
  try {
    const portalUrl = await subscriptionService.getCustomerPortalUrl(req.user.id);
    if (!portalUrl) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    res.json({ url: portalUrl });
  } catch (e) {
    next(e);
  }
});

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
 * Lemon Squeezy webhook handler. Needs raw body for HMAC signature verification.
 * Must be mounted BEFORE express.json() in app.ts.
 */
export function createWebhookRouter() {
  const webhookRouter = Router();

  webhookRouter.post('/api/webhooks/lemonsqueezy', async (req, res) => {
    if (!config.lemonSqueezyWebhookSecret) {
      return res.status(503).json({ error: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing X-Signature header' });
    }

    const rawBody = typeof req.body === 'string' ? req.body : req.body.toString('utf-8');
    if (!subscriptionService.verifyWebhookSignature(rawBody, signature)) {
      logger.error('Lemon Squeezy webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    let event: any;
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    try {
      await subscriptionService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      logger.error({ err, eventName: event?.meta?.event_name }, 'Webhook handler error');
      res.status(500).json({ error: 'Webhook handler error' });
    }
  });

  return webhookRouter;
}
