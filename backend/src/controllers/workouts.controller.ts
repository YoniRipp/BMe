import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { WorkoutsService } from '../services/workouts.service';

export class WorkoutsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const workouts = await WorkoutsService.getAll(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: workouts });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workout = await WorkoutsService.getById(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: workout });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workout = await WorkoutsService.create(req.user!.userId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: workout,
        message: 'Workout created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workout = await WorkoutsService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: workout,
        message: 'Workout updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await WorkoutsService.delete(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Workout deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}