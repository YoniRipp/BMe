import { Heart, Dumbbell, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export interface DashboardHeroProps {
  workoutsThisWeek: number;
  lastSleepHours: number | undefined;
  energyScore: number | undefined;
}

export function DashboardHero({
  workoutsThisWeek,
  lastSleepHours,
  energyScore,
}: DashboardHeroProps) {
  const greeting = getTimeBasedGreeting();
  const energyValue = energyScore != null ? `${energyScore}/10` : '—/10';
  const sleepValue =
    lastSleepHours != null ? `${lastSleepHours.toFixed(1)}h` : '—';
  const workoutsValue =
    workoutsThisWeek === 1 ? '1 workout' : `${workoutsThisWeek} workouts`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
        <CardTitle className="text-xl md:text-2xl">
          How are you feeling today?
        </CardTitle>
        <CardDescription>
          Track your wellness, finances, and goals — all in one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Energy</p>
              <p className="text-lg font-semibold text-foreground">{energyValue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">This week</p>
              <p className="text-lg font-semibold text-foreground">{workoutsValue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Last sleep</p>
              <p className="text-lg font-semibold text-foreground">{sleepValue}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
