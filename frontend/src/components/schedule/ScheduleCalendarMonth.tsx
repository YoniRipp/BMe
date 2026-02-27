import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { WEEK_SUNDAY } from '@/lib/dateRanges';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleCalendarMonthProps {
  currentDate: Date;
  onCurrentDateChange: (d: Date) => void;
  onSelectDate?: (d: Date) => void;
}

export function ScheduleCalendarMonth({
  currentDate,
  onCurrentDateChange,
  onSelectDate,
}: ScheduleCalendarMonthProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, WEEK_SUNDAY);
  const calendarEnd = endOfWeek(monthEnd, WEEK_SUNDAY);

  const today = new Date();
  const days: (Date | null)[] = [];
  let d = new Date(calendarStart);
  while (d <= calendarEnd) {
    days.push(isSameMonth(d, monthStart) ? new Date(d) : null);
    d.setDate(d.getDate() + 1);
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{format(monthStart, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onCurrentDateChange(subMonths(currentDate, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onCurrentDateChange(addMonths(currentDate, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAY_HEADERS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground border-b border-border"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flatMap((row) =>
            row.map((date, i) => {
              if (!date) {
                return (
                  <div key={`empty-${i}`} className="min-h-[60px] p-1 bg-muted/30 border-b border-r border-border" />
                );
              }
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => onSelectDate?.(date)}
                  className={cn(
                    'min-h-[60px] p-1 text-left border-b border-r border-border transition-colors hover:bg-muted/70',
                    isToday && 'bg-primary/10 ring-1 ring-primary',
                    !isToday && 'bg-background'
                  )}
                >
                  <span className={cn('text-sm', isToday && 'font-semibold')}>
                    {format(date, 'd')}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
