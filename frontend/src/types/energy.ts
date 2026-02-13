export interface DailyCheckIn {
  id: string;
  date: Date;
  sleepHours?: number;
}

export interface FoodEntry {
  id: string;
  date: Date;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
  portionAmount?: number;
  portionUnit?: 'g' | 'ml';
  servingType?: 'bottle' | 'can' | 'glass' | 'other';
  /** Meal time range: HH:MM 24h. When set, Energy page shows time and duration. */
  startTime?: string;
  endTime?: string;
}

export const MOOD_OPTIONS = ['Great', 'Good', 'Okay', 'Bad', 'Terrible'] as const;
