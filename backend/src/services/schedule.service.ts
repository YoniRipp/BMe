import { prisma } from '../config/database';
import {
  CreateScheduleItemDto,
  UpdateScheduleItemDto,
} from '../types/schedule.types';
import { NotFoundError } from '../utils/errors';

export class ScheduleService {
  static async getAll(userId: string) {
    return prisma.scheduleItem.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  static async getById(id: string, userId: string) {
    const item = await prisma.scheduleItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundError('Schedule item not found');
    }

    return item;
  }

  static async create(userId: string, data: CreateScheduleItemDto) {
    return prisma.scheduleItem.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async update(id: string, userId: string, data: UpdateScheduleItemDto) {
    const existing = await prisma.scheduleItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Schedule item not found');
    }

    return prisma.scheduleItem.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.scheduleItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Schedule item not found');
    }

    await prisma.scheduleItem.delete({
      where: { id },
    });
  }
}