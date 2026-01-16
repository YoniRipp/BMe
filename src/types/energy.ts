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
}

export const MOOD_OPTIONS = ['Great', 'Good', 'Okay', 'Bad', 'Terrible'] as const;
