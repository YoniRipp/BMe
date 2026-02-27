import { prisma } from '../config/database';
import { CreateTransactionDto, UpdateTransactionDto } from '../types/transactions.types';
import { NotFoundError } from '../utils/errors';

export class TransactionsService {
  static async getAll(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async getById(id: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return transaction;
  }

  static async create(userId: string, data: CreateTransactionDto) {
    return prisma.transaction.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async update(id: string, userId: string, data: UpdateTransactionDto) {
    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    return prisma.transaction.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, userId: string) {
    // Check if transaction exists and belongs to user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    await prisma.transaction.delete({
      where: { id },
    });
  }

  static async getStats(userId: string) {
    const [income, expenses, transactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'expense' },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    const totalIncome = Number(income._sum.amount || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      recentTransactions: transactions,
    };
  }
}