import { Flame, Moon, Wallet, Utensils } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
}

function ProgressRing({ value, max, size = 72, strokeWidth = 6, color, bgColor }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

export interface DailySnapshotProps {
  caloriesEaten: number;
  caloriesGoal: number;
  todaySpent: number;
  dailyBudget: number;
  workoutStreak: number;
  sleepHours: number | undefined;
  currency?: string;
}

export function DailySnapshot({
  caloriesEaten,
  caloriesGoal,
  todaySpent,
  dailyBudget,
  workoutStreak,
  sleepHours,
  currency = '$',
}: DailySnapshotProps) {
  const calPct = caloriesGoal > 0 ? Math.round((caloriesEaten / caloriesGoal) * 100) : 0;
  const spendPct = dailyBudget > 0 ? Math.round((todaySpent / dailyBudget) * 100) : 0;
  const sleepValue = sleepHours != null ? `${sleepHours.toFixed(1)}h` : '--';
  const currencySymbol = currency === 'ILS' ? '₪' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  return (
    <Card>
      <CardContent className="p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Calories */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing
                value={caloriesEaten}
                max={caloriesGoal || 2000}
                color="hsl(var(--chart-1))"
                bgColor="hsl(var(--muted))"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Calories</p>
              <p className="text-base font-bold tabular-nums">
                {Math.round(caloriesEaten)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {caloriesGoal > 0 ? `${calPct}% of ${caloriesGoal}` : 'no goal set'}
              </p>
            </div>
          </div>

          {/* Spending */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing
                value={todaySpent}
                max={dailyBudget || 100}
                color={spendPct > 100 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'}
                bgColor="hsl(var(--muted))"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Spent</p>
              <p className="text-base font-bold tabular-nums">
                {currencySymbol}{Math.round(todaySpent)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {dailyBudget > 0 ? `of ${currencySymbol}${Math.round(dailyBudget)}/day` : 'no budget set'}
              </p>
            </div>
          </div>

          {/* Workout streak */}
          <div className="flex items-center gap-3">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">This week</p>
              <p className="text-base font-bold tabular-nums">
                {workoutStreak}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {workoutStreak === 1 ? 'workout' : 'workouts'}
              </p>
            </div>
          </div>

          {/* Sleep */}
          <div className="flex items-center gap-3">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950">
              <Moon className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Last sleep</p>
              <p className="text-base font-bold tabular-nums">{sleepValue}</p>
              <p className="text-[10px] text-muted-foreground">hours</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
