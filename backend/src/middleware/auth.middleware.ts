import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedError('Access token not provided');
    }

    // Verify token
    const payload = JWTService.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
};