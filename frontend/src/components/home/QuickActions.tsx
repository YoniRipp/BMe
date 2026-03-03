import { Utensils, Wallet, Dumbbell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onLogFood: () => void;
  onLogExpense: () => void;
  onLogWorkout: () => void;
  onLogSchedule: () => void;
}

const actions = [
  { key: 'food', icon: Utensils, label: 'Log Food', color: 'text-green-600' },
  { key: 'expense', icon: Wallet, label: 'Log Expense', color: 'text-blue-600' },
  { key: 'workout', icon: Dumbbell, label: 'Log Workout', color: 'text-orange-600' },
  { key: 'schedule', icon: Calendar, label: 'Log Schedule', color: 'text-purple-600' },
] as const;

export function QuickActions({ onLogFood, onLogExpense, onLogWorkout, onLogSchedule }: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    food: onLogFood,
    expense: onLogExpense,
    workout: onLogWorkout,
    schedule: onLogSchedule,
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ key, icon: Icon, label, color }) => (
        <Button
          key={key}
          variant="outline"
          className="flex h-auto flex-col gap-1.5 py-3"
          onClick={handlers[key]}
        >
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-[11px] font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}
