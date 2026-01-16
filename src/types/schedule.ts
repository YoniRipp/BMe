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
