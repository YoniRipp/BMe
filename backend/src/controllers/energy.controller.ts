import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EnergyService } from '../services/energy.service';

export class EnergyController {
  // Check-ins
  static async getAllCheckIns(req: Request, res: Response, next: NextFunction) {
    try {
      const checkIns = await EnergyService.getAllCheckIns(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: checkIns });
    } catch (error) {
      next(error);
    }
  }

  static async getCheckInById(req: Request, res: Response, next: NextFunction) {
    try {
      const checkIn = await EnergyService.getCheckInById(
        req.params.id,
        req.user!.userId
      );
      res.status(StatusCodes.OK).json({ success: true, data: checkIn });
    } catch (error) {
      next(error);
    }
  }

  static async createCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const checkIn = await EnergyService.createCheckIn(req.user!.userId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: checkIn,
        message: 'Energy check-in created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const checkIn = await EnergyService.updateCheckIn(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: checkIn,
        message: 'Energy check-in updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      await EnergyService.deleteCheckIn(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Energy check-in deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Food Entries
  static async getAllFoodEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await EnergyService.getAllFoodEntries(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  }

  static async getFoodEntryById(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await EnergyService.getFoodEntryById(
        req.params.id,
        req.user!.userId
      );
      res.status(StatusCodes.OK).json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  }

  static async createFoodEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await EnergyService.createFoodEntry(req.user!.userId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: entry,
        message: 'Food entry created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateFoodEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await EnergyService.updateFoodEntry(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: entry,
        message: 'Food entry updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFoodEntry(req: Request, res: Response, next: NextFunction) {
    try {
      await EnergyService.deleteFoodEntry(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Food entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}