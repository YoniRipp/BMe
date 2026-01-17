import { z } from 'zod';

export const createEnergyCheckInSchema = z.object({
  date: z.coerce.date(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.string().optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  stressLevel: z.number().int().min(1).max(5).optional(),
  mood: z.string().optional(),
  caloriesConsumed: z.number().int().optional(),
  caloriesBurned: z.number().int().optional(),
});

export const updateEnergyCheckInSchema = createEnergyCheckInSchema.partial();

export const createFoodEntrySchema = z.object({
  date: z.coerce.date(),
  name: z.string().min(1, 'Name is required'),
  calories: z.number().int().positive('Calories must be positive'),
  protein: z.number().int().min(0, 'Protein must be non-negative'),
  carbs: z.number().int().min(0, 'Carbs must be non-negative'),
  fats: z.number().int().min(0, 'Fats must be non-negative'),
});

export const updateFoodEntrySchema = createFoodEntrySchema.partial();

export type CreateEnergyCheckInDto = z.infer<typeof createEnergyCheckInSchema>;
export type UpdateEnergyCheckInDto = z.infer<typeof updateEnergyCheckInSchema>;
export type CreateFoodEntryDto = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryDto = z.infer<typeof updateFoodEntrySchema>;