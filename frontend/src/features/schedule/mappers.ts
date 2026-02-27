import { ScheduleItem } from '@/types/schedule';

export function apiScheduleItemToScheduleItem(a: {
  id: string;
  date?: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  emoji?: string;
  order: number;
  isActive: boolean;
  groupId?: string;
  recurrence?: string;
  color?: string;
}): ScheduleItem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: a.id,
    date: a.date && /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : today,
    title: a.title,
    startTime: a.startTime,
    endTime: a.endTime,
    category: a.category,
    emoji: a.emoji,
    order: a.order,
    isActive: a.isActive,
    groupId: a.groupId,
    recurrence: a.recurrence as ScheduleItem['recurrence'] | undefined,
    color: a.color,
  };
}
