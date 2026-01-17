import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validator.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { loginLimiter } from '../middleware/rateLimiter';
import { signupSchema, loginSchema } from '../types/auth.types';
import { z } from 'zod';

const router = Router();

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Public routes
router.post(
  '/signup',
  validateRequest(signupSchema),
  AuthController.signup
);

router.post(
  '/login',
  loginLimiter,
  validateRequest(loginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  AuthController.refresh
);

router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', authMiddleware, AuthController.getMe);

export default router;