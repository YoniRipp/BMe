import { prisma } from '../config/database';
import {
  CreateEnergyCheckInDto,
  UpdateEnergyCheckInDto,
  CreateFoodEntryDto,
  UpdateFoodEntryDto,
} from '../types/energy.types';
import { NotFoundError } from '../utils/errors';

export class EnergyService {
  // Energy Check-ins
  static async getAllCheckIns(userId: string) {
    return prisma.energyCheckIn.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async getCheckInById(id: string, userId: string) {
    const checkIn = await prisma.energyCheckIn.findFirst({
      where: { id, userId },
    });

    if (!checkIn) {
      throw new NotFoundError('Energy check-in not found');
    }

    return checkIn;
  }

  static async createCheckIn(userId: string, data: CreateEnergyCheckInDto) {
    return prisma.energyCheckIn.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async updateCheckIn(
    id: string,
    userId: string,
    data: UpdateEnergyCheckInDto
  ) {
    const existing = await prisma.energyCheckIn.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Energy check-in not found');
    }

    return prisma.energyCheckIn.update({
      where: { id },
      data,
    });
  }

  static async deleteCheckIn(id: string, userId: string) {
    const existing = await prisma.energyCheckIn.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Energy check-in not found');
    }

    await prisma.energyCheckIn.delete({
      where: { id },
    });
  }

  // Food Entries
  static async getAllFoodEntries(userId: string) {
    return prisma.foodEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async getFoodEntryById(id: string, userId: string) {
    const entry = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new NotFoundError('Food entry not found');
    }

    return entry;
  }

  static async createFoodEntry(userId: string, data: CreateFoodEntryDto) {
    return prisma.foodEntry.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async updateFoodEntry(id: string, userId: string, data: UpdateFoodEntryDto) {
    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Food entry not found');
    }

    return prisma.foodEntry.update({
      where: { id },
      data,
    });
  }

  static async deleteFoodEntry(id: string, userId: string) {
    const existing = await prisma.foodEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Food entry not found');
    }

    await prisma.foodEntry.delete({
      where: { id },
    });
  }
}