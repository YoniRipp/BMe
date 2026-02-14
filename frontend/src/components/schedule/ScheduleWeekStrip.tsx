import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { WEEK_SUNDAY } from '@/lib/dateRanges';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import { ScheduleItem } from '@/components/home/ScheduleItem';

interface ScheduleWeekStripProps {
  currentDate: Date;
  onCurrentDateChange: (d: Date) => void;
  scheduleItems: ScheduleItemType[];
  onEdit?: (item: ScheduleItemType) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  categoryColors?: Record<string, string>;
}

export function ScheduleWeekStrip({
  currentDate,
  onCurrentDateChange,
  scheduleItems,
  onEdit,
  onDelete,
  readOnly = false,
  categoryColors,
}: ScheduleWeekStripProps) {
  const weekStart = startOfWeek(currentDate, WEEK_SUNDAY);
  const weekEnd = endOfWeek(currentDate, WEEK_SUNDAY);
  const today = new Date();

  const days: Date[] = [];
  const d = new Date(weekStart);
  while (d <= weekEnd) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  const getItemsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return [...scheduleItems]
      .filter((item) => item.isActive && item.date === dateStr)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onCurrentDateChange(subWeeks(currentDate, 1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onCurrentDateChange(addWeeks(currentDate, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'rounded-lg border p-3 min-h-[120px]',
              isSameDay(day, today)
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            )}
          >
            <p className={cn(
              'text-sm font-medium mb-2',
              isSameDay(day, today) && 'text-primary'
            )}>
              {format(day, 'EEE')}
            </p>
            <p className="text-xs text-muted-foreground mb-2">{format(day, 'MMM d')}</p>
            <div className="space-y-1">
              {getItemsForDay(day).map((item) => (
                <ScheduleItem
                  key={item.id}
                  item={item}
                  isPast={true}
                  onEdit={readOnly ? undefined : onEdit}
                  onDelete={readOnly ? undefined : onDelete}
                  categoryColors={categoryColors}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
