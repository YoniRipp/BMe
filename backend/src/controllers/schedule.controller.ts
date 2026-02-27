import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ScheduleService } from '../services/schedule.service';

export class ScheduleController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await ScheduleService.getAll(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ScheduleService.getById(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ScheduleService.create(req.user!.userId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: item,
        message: 'Schedule item created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ScheduleService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: item,
        message: 'Schedule item updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ScheduleService.delete(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Schedule item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}