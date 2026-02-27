import { z } from 'zod';

export const memberRoleSchema = z.enum(['admin', 'member']);

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
});

export const updateGroupSchema = createGroupSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

export type CreateGroupDto = z.infer<typeof createGroupSchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;