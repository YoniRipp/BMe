import { z } from 'zod';

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;