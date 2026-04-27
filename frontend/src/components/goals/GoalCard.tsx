import { Goal, GoalType } from '@/types/goals';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Dumbbell, Moon, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useGoalProgress } from '@/features/goals/useGoalProgress';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { toast } from 'sonner';

const GOAL_ICONS: Record<GoalType, React.ElementType> = {
  calories: Flame,
  workouts: Dumbbell,
  sleep: Moon,
};
const RING_COLORS: Record<GoalType, string> = {
  calories: 'hsl(var(--terracotta))',
  workouts: 'hsl(var(--info))',
  sleep: 'hsl(var(--gold))',
};
const GOAL_LABELS: Record<GoalType, string> = {
  calories: 'calories',
  workouts: 'workouts',
  sleep: 'hours avg',
};
const formatGoalValue = (type: GoalType, value: number) =>
  type === 'sleep' ? `${value.toFixed(1)}h` : value.toLocaleString();

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const { deleteGoal } = useGoals();
  const progress = useGoalProgress(goal.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    deleteGoal(goal.id);
    toast.success('Goal deleted');
  };

  const Icon = GOAL_ICONS[goal.type];
  const achieved = progress.percentage >= 100;
  const ringColor = achieved ? 'hsl(var(--success))' : RING_COLORS[goal.type];
  const circumference = 2 * Math.PI * 26;

  return (
    <>
      <Card className={cn('p-4', achieved && 'border-success/40')}>
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke={ringColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - Math.min(progress.percentage / 100, 1))}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-5 h-5" style={{ color: ringColor }} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{goal.period}</p>
            <h4 className="font-display text-base font-medium mt-0.5 capitalize">{goal.type} goal</h4>
            <p className="text-sm text-muted-foreground tabular-nums mt-1">
              <span style={{ color: ringColor }} className="font-bold">{formatGoalValue(goal.type, progress.current)}</span>
              {' '}/ {formatGoalValue(goal.type, goal.target)} {GOAL_LABELS[goal.type]}
            </p>
          </div>

          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(goal)}
                className="h-8 w-8"
                aria-label="Edit goal"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete goal"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {achieved && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-xs text-success font-semibold uppercase tracking-wider">Achieved!</span>
          </div>
        )}
      </Card>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </>
  );
}
