/**
 * Route helper — DRY middleware chains for protected routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';

/**
 * Create a router with auth + effective user ID resolution pre-applied.
 */
export function createProtectedRouter(): Router {
  const router = Router();
  router.use(requireAuth, resolveEffectiveUserId);
  return router;
}

/** Middleware chain for protected routes (when you can't use router-level middleware). */
export const withUser: Array<import('express').RequestHandler> = [requireAuth, resolveEffectiveUserId as import('express').RequestHandler];
