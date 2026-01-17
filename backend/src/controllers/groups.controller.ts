import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GroupsService } from '../services/groups.service';

export class GroupsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await GroupsService.getAll(req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await GroupsService.getById(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({ success: true, data: group });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await GroupsService.create(req.user!.userId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: group,
        message: 'Group created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await GroupsService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: group,
        message: 'Group updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.delete(req.params.id, req.user!.userId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Group deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const invitation = await GroupsService.inviteMember(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: invitation,
        message: 'Member invited successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await GroupsService.updateMemberRole(
        req.params.id,
        req.params.memberId,
        req.user!.userId,
        req.body
      );
      res.status(StatusCodes.OK).json({
        success: true,
        data: member,
        message: 'Member role updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.removeMember(
        req.params.id,
        req.params.memberId,
        req.user!.userId
      );
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}