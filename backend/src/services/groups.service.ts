import { prisma } from '../config/database';
import {
  CreateGroupDto,
  UpdateGroupDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from '../types/groups.types';
import { NotFoundError, AppError } from '../utils/errors';
import { StatusCodes } from 'http-status-codes';

export class GroupsService {
  static async getAll(userId: string) {
    return prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        invitations: true,
      },
    });
  }

  static async getById(id: string, userId: string) {
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        invitations: true,
      },
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    return group;
  }

  static async create(userId: string, data: CreateGroupDto) {
    const group = await prisma.group.create({
      data: {
        ...data,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return group;
  }

  static async update(id: string, userId: string, data: UpdateGroupDto) {
    const exists = await prisma.group.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundError('Group not found');
    }
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'admin' } } },
        ],
      },
    });
    if (!group) {
      throw new AppError('You do not have permission to update this group', StatusCodes.FORBIDDEN);
    }

    return prisma.group.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, userId: string) {
    const exists = await prisma.group.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundError('Group not found');
    }
    const group = await prisma.group.findFirst({
      where: { id, ownerId: userId },
    });
    if (!group) {
      throw new AppError('Only the group owner can delete this group', StatusCodes.FORBIDDEN);
    }

    await prisma.group.delete({
      where: { id },
    });
  }

  static async inviteMember(groupId: string, userId: string, data: InviteMemberDto) {
    const exists = await prisma.group.findUnique({ where: { id: groupId } });
    if (!exists) {
      throw new NotFoundError('Group not found');
    }
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'admin' } } },
        ],
      },
    });
    if (!group) {
      throw new AppError('You do not have permission to invite members to this group', StatusCodes.FORBIDDEN);
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId,
        user: { email: data.email },
      },
    });

    if (existingMember) {
      throw new AppError('User is already a member', StatusCodes.CONFLICT);
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    return prisma.groupInvitation.create({
      data: {
        groupId,
        email: data.email,
        invitedBy: userId,
        expiresAt,
      },
    });
  }

  static async updateMemberRole(
    groupId: string,
    memberId: string,
    userId: string,
    data: UpdateMemberRoleDto
  ) {
    const exists = await prisma.group.findUnique({ where: { id: groupId } });
    if (!exists) {
      throw new NotFoundError('Group not found');
    }
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'admin' } } },
        ],
      },
    });
    if (!group) {
      throw new AppError('You do not have permission to update roles in this group', StatusCodes.FORBIDDEN);
    }

    return prisma.groupMember.update({
      where: { id: memberId },
      data: { role: data.role },
    });
  }

  static async removeMember(groupId: string, memberId: string, userId: string) {
    const exists = await prisma.group.findUnique({ where: { id: groupId } });
    if (!exists) {
      throw new NotFoundError('Group not found');
    }
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'admin' } } },
        ],
      },
    });
    if (!group) {
      throw new AppError('You do not have permission to remove members from this group', StatusCodes.FORBIDDEN);
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });
  }
}