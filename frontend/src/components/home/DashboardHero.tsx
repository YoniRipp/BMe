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
    <Card className="bg-white shadow">
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-stone">{greeting}</p>
        <CardTitle className="text-xl md:text-2xl text-charcoal">
          How are you feeling today?
        </CardTitle>
        <CardDescription className="text-stone">
          Track your wellness, finances, and goals — all in one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone/10 ring-1 ring-stone/20">
              <Heart className="h-4 w-4 text-stone" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone">Energy</p>
              <p className="text-lg font-semibold text-charcoal">{energyValue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone/10 ring-1 ring-stone/20">
              <Dumbbell className="h-4 w-4 text-stone" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone">This week</p>
              <p className="text-lg font-semibold text-charcoal">{workoutsValue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone/10 ring-1 ring-stone/20">
              <Moon className="h-4 w-4 text-stone" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone">Last sleep</p>
              <p className="text-lg font-semibold text-charcoal">{sleepValue}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
