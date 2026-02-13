export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  category: string;
  emoji?: string;
  order: number;
  isActive: boolean;
  groupId?: string;
  recurrence?: 'daily' | 'weekdays' | 'weekends';
}

export const SCHEDULE_CATEGORIES = [
  'Work',
  'Exercise',
  'Meal',
  'Sleep',
  'Personal',
  'Social',
  'Other'
] as const;

export const CATEGORY_EMOJIS: Record<string, string> = {
  Work: '💼',
  Exercise: '💪',
  Meal: '🍽️',
  Sleep: '😴',
  Personal: '🧘',
  Social: '👥',
  Other: '📌'
};

/** Tailwind-compatible border/background classes for schedule categories. */
export const CATEGORY_COLORS: Record<string, string> = {
  Work: 'border-l-blue-500 bg-blue-500/5',
  Exercise: 'border-l-green-500 bg-green-500/5',
  Meal: 'border-l-amber-500 bg-amber-500/5',
  Sleep: 'border-l-indigo-500 bg-indigo-500/5',
  Personal: 'border-l-purple-500 bg-purple-500/5',
  Social: 'border-l-pink-500 bg-pink-500/5',
  Other: 'border-l-slate-500 bg-slate-500/5',
};
