import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TransactionsService } from '../services/transactions.service';

export class TransactionsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await TransactionsService.getAll(req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await TransactionsService.getById(
        req.params.id,
        req.user!.userId
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await TransactionsService.create(
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await TransactionsService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await TransactionsService.delete(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await TransactionsService.getStats(req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}