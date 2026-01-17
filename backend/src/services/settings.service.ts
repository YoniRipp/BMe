import { prisma } from '../config/database';
import { UpdateSettingsDto } from '../types/settings.types';
import { NotFoundError } from '../utils/errors';

export class SettingsService {
  static async get(userId: string) {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.userSettings.create({
        data: {
          userId,
          theme: 'system',
          currency: 'USD',
          language: 'en',
          timezone: 'UTC',
        },
      });
    }

    return settings;
  }

  static async update(userId: string, data: UpdateSettingsDto) {
    const existing = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Create if doesn't exist
      return prisma.userSettings.create({
        data: {
          userId,
          ...data,
          theme: data.theme || 'system',
          currency: data.currency || 'USD',
          language: data.language || 'en',
          timezone: data.timezone || 'UTC',
        },
      });
    }

    return prisma.userSettings.update({
      where: { userId },
      data,
    });
  }
}