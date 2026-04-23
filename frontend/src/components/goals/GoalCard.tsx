import { Goal, GoalType } from '@/types/goals';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Dumbbell, Moon, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useGoalProgress } from '@/features/goals/useGoalProgress';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { toast } from 'sonner';

const GOAL_ICON_STYLES: Record<GoalType, { icon: React.ElementType; bg: string; color: string }> = {
  calories: { icon: Flame, bg: 'bg-terracotta/10', color: 'text-terracotta' },
  workouts: { icon: Dumbbell, bg: 'bg-info/10', color: 'text-info' },
  sleep: { icon: Moon, bg: 'bg-gold/10', color: 'text-gold' },
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

  const style = GOAL_ICON_STYLES[goal.type];
  const Icon = style.icon;
  const achieved = progress.percentage >= 100;

  return (
    <>
      <Card className={cn('p-5', achieved && 'border-success/40 bg-success/[0.03]')}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', style.bg, style.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display text-base font-medium tracking-tight capitalize leading-tight">
                {goal.type} goal <span className="text-muted-foreground font-sans font-normal text-sm normal-case">· {goal.period}</span>
              </h4>
              <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                {formatGoalValue(goal.type, progress.current)} / {formatGoalValue(goal.type, goal.target)} {GOAL_LABELS[goal.type]}
              </p>
            </div>
          </div>
          {achieved && (
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          )}
        </div>

        <div className="mb-4">
          <Progress value={progress.percentage} className="h-1.5" />
          <div className="flex items-center justify-between mt-2">
            <span className={cn(
              'text-xs font-medium tabular-nums',
              achieved ? 'text-success' :
              progress.percentage >= 80 ? 'text-success' :
              progress.percentage >= 50 ? 'text-warning' : 'text-muted-foreground'
            )}>
              {progress.percentage.toFixed(0)}% complete
            </span>
            {achieved && (
              <span className="text-xs text-success font-semibold uppercase tracking-wider">Achieved!</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(goal)}
              className="flex-1"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            aria-label="Delete goal"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
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
