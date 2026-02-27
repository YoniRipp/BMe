import { prisma } from '../config/database';
import { CreateGoalDto, UpdateGoalDto } from '../types/goals.types';
import { NotFoundError } from '../utils/errors';

export class GoalsService {
  static async getAll(userId: string) {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundError('Goal not found');
    }

    return goal;
  }

  static async create(userId: string, data: CreateGoalDto) {
    return prisma.goal.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async update(id: string, userId: string, data: UpdateGoalDto) {
    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Goal not found');
    }

    return prisma.goal.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Goal not found');
    }

    await prisma.goal.delete({
      where: { id },
    });
  }
}