/**
 * Middleware to gate endpoints behind a Pro subscription.
 * Must be used after requireAuth (req.user must be set).
 *
 * When Stripe is not configured (no STRIPE_SECRET_KEY), all users are
 * allowed through so development works without Stripe keys.
 */
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';

export async function requirePro(req, res, next) {
  // When Stripe is not configured, allow all access (dev convenience)
  if (!config.stripeSecretKey) {
    return next();
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [req.user.id],
    );

    const status = rows[0]?.subscription_status || 'free';
    if (status === 'pro') {
      return next();
    }

    return res.status(403).json({
      error: 'Pro subscription required',
      upgradeUrl: '/pricing',
    });
  } catch (e) {
    next(e);
  }
}
