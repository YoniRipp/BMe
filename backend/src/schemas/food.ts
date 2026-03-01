/**
 * Zod schemas for food API request bodies.
 */
import { z } from 'zod';

export const lookupOrCreateFoodSchema = z.object({
  name: z.string().min(1).max(200).transform((s) => s.trim()),
  liquid: z.boolean().optional(),
});
