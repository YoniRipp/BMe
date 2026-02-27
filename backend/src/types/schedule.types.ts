import { z } from 'zod';

export const createScheduleItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  category: z.string().min(1, 'Category is required'),
  emoji: z.string().optional(),
  order: z.number().int(),
  isActive: z.boolean().optional().default(true),
  groupId: z.string().uuid().optional(),
});

export const updateScheduleItemSchema = createScheduleItemSchema.partial();

export type CreateScheduleItemDto = z.infer<typeof createScheduleItemSchema>;
export type UpdateScheduleItemDto = z.infer<typeof updateScheduleItemSchema>;