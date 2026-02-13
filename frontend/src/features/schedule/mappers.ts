import { ScheduleItem } from '@/types/schedule';

export function apiScheduleItemToScheduleItem(a: {
  id: string;
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
  return {
    id: a.id,
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
