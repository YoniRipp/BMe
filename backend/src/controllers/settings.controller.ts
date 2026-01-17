import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SettingsService } from '../services/settings.service';

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.get(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.update(req.user!.userId, req.body);
      res.status(StatusCodes.OK).json({
        success: true,
        data: settings,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}