import { useState } from 'react';
import { Workout } from '@/types/workout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Flame } from 'lucide-react';
import { format, subDays, isSameDay, subMonths, subYears } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeeklyWorkoutGridProps {
  workouts: Workout[];
}

export function WeeklyWorkoutGrid({ workouts }: WeeklyWorkoutGridProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const today = new Date();

  const hasWorkoutOnDay = (date: Date) => {
    return workouts.some(w => isSameDay(new Date(w.date), date));
  };

  // Calculate dates and streak based on period
  let dates: Date[] = [];
  let streak = 0;
  let totalDays = 0;
  let periodLabel = '';

  if (period === 'weekly') {
    dates = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
    totalDays = 7;
    periodLabel = 'Weekly';
  } else if (period === 'monthly') {
    const monthStart = subMonths(today, 1);
    dates = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
    totalDays = 30;
    periodLabel = 'Monthly';
  } else if (period === 'yearly') {
    const yearStart = subYears(today, 1);
    dates = Array.from({ length: 365 }, (_, i) => subDays(today, 364 - i));
    totalDays = 365;
    periodLabel = 'Yearly';
  }

  streak = dates.filter(day => hasWorkoutOnDay(day)).length;

  // For monthly and yearly, show a summary view instead of all days
  const showDetailedGrid = period === 'weekly';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Workout Streak</h3>
        <div className="flex items-center gap-1 text-orange-600">
          <Flame className="w-4 h-4" />
          <span className="font-bold">{streak}/{totalDays}</span>
        </div>
      </div>
      
      <Tabs value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly' | 'yearly')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        
        <TabsContent value={period} className="mt-0">
          {showDetailedGrid ? (
            <div className="grid grid-cols-7 gap-2">
              {dates.map((day, idx) => {
                const hasWorkout = hasWorkoutOnDay(day);
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg border-2",
                      hasWorkout ? "bg-green-50 border-green-500" : "bg-red-50 border-red-200",
                      isToday && "ring-2 ring-primary"
                    )}
                  >
                    <span className="text-xs font-medium mb-1">
                      {format(day, 'EEE')}
                    </span>
                    <span className="text-xs text-muted-foreground mb-2">
                      {format(day, 'd')}
                    </span>
                    {hasWorkout ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {streak} workouts in the last {totalDays} days
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((streak / totalDays) * 100)}% consistency
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
