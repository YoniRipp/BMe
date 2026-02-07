import { DailyCheckIn, FoodEntry } from '@/types/energy';

export function apiCheckInToDailyCheckIn(a: {
  id: string;
  date: string;
  sleepHours?: number;
}): DailyCheckIn {
  return {
    id: a.id,
    date: new Date(a.date),
    sleepHours: a.sleepHours != null ? a.sleepHours : undefined,
  };
}

export function apiFoodEntryToFoodEntry(a: {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): FoodEntry {
  return {
    id: a.id,
    date: new Date(a.date),
    name: a.name,
    calories: a.calories,
    protein: a.protein,
    carbs: a.carbs,
    fats: a.fats,
  };
}
