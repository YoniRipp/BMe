import { prisma } from '../config/database';
import { CreateWorkoutDto, UpdateWorkoutDto } from '../types/workouts.types';
import { NotFoundError } from '../utils/errors';

export class WorkoutsService {
  static async getAll(userId: string) {
    return prisma.workout.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const workout = await prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    return workout;
  }

  static async create(userId: string, data: CreateWorkoutDto) {
    return prisma.workout.create({
      data: {
        ...data,
        exercises: data.exercises as any,
        userId,
      },
    });
  }

  static async update(id: string, userId: string, data: UpdateWorkoutDto) {
    const existing = await prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Workout not found');
    }

    return prisma.workout.update({
      where: { id },
      data: {
        ...data,
        exercises: data.exercises ? (data.exercises as any) : undefined,
      },
    });
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Workout not found');
    }

    await prisma.workout.delete({
      where: { id },
    });
  }
}