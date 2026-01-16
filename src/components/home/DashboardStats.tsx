import { QuickStat } from '@/components/shared/QuickStat';
import { Dumbbell, Zap, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  workoutsThisWeek: number;
  avgEnergy: number;
  savingsRate: number;
}

export function DashboardStats({ workoutsThisWeek, avgEnergy, savingsRate }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <QuickStat
        label="Workouts This Week"
        value={workoutsThisWeek}
        icon={Dumbbell}
        iconColor="text-blue-600"
      />
      <QuickStat
        label="Avg Sleep Hours"
        value={`${avgEnergy.toFixed(1)}h`}
        icon={Zap}
        iconColor="text-purple-600"
      />
      <QuickStat
        label="Savings Rate"
        value={`${savingsRate}%`}
        icon={TrendingUp}
        iconColor="text-green-600"
      />
    </div>
  );
}
