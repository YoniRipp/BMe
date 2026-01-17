import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { JWTService } from './jwt.service';
import { SignupDto, LoginDto } from '../types/auth.types';
import { AppError } from '../utils/errors';
import { StatusCodes } from 'http-status-codes';

export class AuthService {
  static async signUp(data: SignupDto) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', StatusCodes.CONFLICT);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        settings: {
          create: {
            theme: 'system',
            currency: 'USD',
            language: 'en',
            timezone: 'UTC',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  static async signIn(data: LoginDto) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
    }

    // Generate tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
    }

    // Generate new access token
    const accessToken = JWTService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    return {
      accessToken,
    };
  }

  static async signOut(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    return user;
  }
}