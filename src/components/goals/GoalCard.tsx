import { Goal } from '@/types/goals';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Dumbbell, DollarSign, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useGoalProgress } from '@/features/goals/useGoalProgress';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { toast } from 'sonner';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const { deleteGoal } = useGoals();
  const progress = useGoalProgress(goal.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getIcon = () => {
    switch (goal.type) {
      case 'calories':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'workouts':
        return <Dumbbell className="w-5 h-5 text-blue-600" />;
      case 'savings':
        return <DollarSign className="w-5 h-5 text-green-600" />;
    }
  };

  const getLabel = () => {
    switch (goal.type) {
      case 'calories':
        return 'calories';
      case 'workouts':
        return 'workouts';
      case 'savings':
        return '% saved';
    }
  };

  const formatValue = (value: number) => {
    if (goal.type === 'savings') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
    toast.success('Goal deleted');
  };

  return (
    <>
      <Card className={cn(
        "p-4",
        progress.percentage >= 100 && "ring-2 ring-green-500"
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h4 className="font-semibold capitalize">
                {goal.type} Goal ({goal.period})
              </h4>
              <p className="text-sm text-muted-foreground">
                {formatValue(progress.current)} / {formatValue(goal.target)} {getLabel()}
              </p>
            </div>
          </div>
          {progress.percentage >= 100 && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
        </div>

        <div className="mb-3">
          <Progress value={progress.percentage} className="h-2" />
          <div className="flex items-center justify-between mt-1">
            <span className={cn(
              "text-sm font-medium",
              progress.percentage >= 100 ? "text-green-600" :
              progress.percentage >= 80 ? "text-green-500" :
              progress.percentage >= 50 ? "text-yellow-600" : "text-red-600"
            )}>
              {progress.percentage.toFixed(0)}% Complete
            </span>
            {progress.percentage >= 100 && (
              <span className="text-xs text-green-600 font-medium">Achieved!</span>
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
              <Pencil className="w-4 h-4 mr-1" aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive"
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
