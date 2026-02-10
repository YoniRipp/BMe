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
}

export const MOOD_OPTIONS = ['Great', 'Good', 'Okay', 'Bad', 'Terrible'] as const;
