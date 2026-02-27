export interface ScheduleItem {
  id: string;
  /** Date for this item (YYYY-MM-DD). */
  date: string;
  title: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  category: string;
  emoji?: string;
  order: number;
  isActive: boolean;
  groupId?: string;
  recurrence?: 'daily' | 'weekdays' | 'weekends';
  /** Optional preset id (e.g. 'blue', 'green'). Overrides category default. */
  color?: string;
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

/** Preset ids for schedule colors (stored in DB and settings). */
export const SCHEDULE_COLOR_PRESET_IDS = [
  'blue',
  'green',
  'amber',
  'indigo',
  'purple',
  'pink',
  'slate',
  'red',
] as const;

export type ScheduleColorPresetId = (typeof SCHEDULE_COLOR_PRESET_IDS)[number];

/** Map preset id to Tailwind border + background classes. */
export const SCHEDULE_PRESET_CLASSES: Record<string, string> = {
  blue: 'border-l-blue-500 bg-blue-500/5',
  green: 'border-l-green-500 bg-green-500/5',
  amber: 'border-l-amber-500 bg-amber-500/5',
  indigo: 'border-l-indigo-500 bg-indigo-500/5',
  purple: 'border-l-purple-500 bg-purple-500/5',
  pink: 'border-l-pink-500 bg-pink-500/5',
  slate: 'border-l-slate-500 bg-slate-500/5',
  red: 'border-l-red-500 bg-red-500/5',
};

/** Tailwind-compatible border/background classes for schedule categories (defaults). */
export const CATEGORY_COLORS: Record<string, string> = {
  Work: 'border-l-blue-500 bg-blue-500/5',
  Exercise: 'border-l-green-500 bg-green-500/5',
  Meal: 'border-l-amber-500 bg-amber-500/5',
  Sleep: 'border-l-indigo-500 bg-indigo-500/5',
  Personal: 'border-l-purple-500 bg-purple-500/5',
  Social: 'border-l-pink-500 bg-pink-500/5',
  Other: 'border-l-slate-500 bg-slate-500/5',
};

const FALLBACK_CLASSES = 'border-l-slate-500 bg-slate-500/5';

/**
 * Resolve Tailwind classes for a schedule item.
 * Priority: item.color (preset) → categoryColors[item.category] (preset) → CATEGORY_COLORS[item.category].
 */
export function getScheduleItemClasses(
  item: ScheduleItem,
  categoryColors?: Record<string, string>
): string {
  if (item.color && SCHEDULE_PRESET_CLASSES[item.color]) {
    return SCHEDULE_PRESET_CLASSES[item.color];
  }
  const categoryPreset = categoryColors?.[item.category];
  if (categoryPreset && SCHEDULE_PRESET_CLASSES[categoryPreset]) {
    return SCHEDULE_PRESET_CLASSES[categoryPreset];
  }
  return CATEGORY_COLORS[item.category] ?? FALLBACK_CLASSES;
}
