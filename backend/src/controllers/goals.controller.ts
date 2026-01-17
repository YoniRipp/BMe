import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GoalsService } from '../services/goals.service';

export class GoalsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const goals = await GoalsService.getAll(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: goals });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const goal = await GoalsService.getById(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: goal });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const goal = await GoalsService.create(req.user!.userId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: goal,
        message: 'Goal created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const goal = await GoalsService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: goal,
        message: 'Goal updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await GoalsService.delete(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}