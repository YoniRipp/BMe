import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '../services/auth.service';
import { signupSchema, loginSchema } from '../types/auth.types';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const data = signupSchema.parse(req.body);
      const result = await AuthService.signUp(data);

      // Set httpOnly cookie with access token
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          user: result.user,
          refreshToken: result.refreshToken,
        },
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.signIn(data);

      // Set httpOnly cookie with access token
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          user: result.user,
          refreshToken: result.refreshToken,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;

      if (refreshToken) {
        await AuthService.signOut(refreshToken);
      }

      // Clear access token cookie
      res.clearCookie('accessToken');

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
          },
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Set new httpOnly cookie with access token
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
      }

      const user = await AuthService.getCurrentUser(req.user.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}