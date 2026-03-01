import { useState } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalModal } from '@/components/goals/GoalModal';
import { ContentWithLoading } from '@/components/shared/ContentWithLoading';
import { PageTitle } from '@/components/layout/PageTitle';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import type { Goal } from '@/types/goals';

export function Goals() {
  const { goals, goalsLoading, goalsError, addGoal, updateGoal } = useGoals();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  const handleGoalSave = (data: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }
    setEditingGoal(undefined);
    setGoalModalOpen(false);
  };

  const handleGoalEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageTitle title="Goals" subtitle="Track what matters" />

      <ContentWithLoading loading={goalsLoading} loadingText="Loading goals..." error={goalsError}>
        <div className="space-y-3">
          {goals.length === 0 ? (
            <Card
              className="p-8 border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors text-center"
              onClick={() => {
                setEditingGoal(undefined);
                setGoalModalOpen(true);
              }}
            >
              <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">Add your first goal</p>
              <p className="text-sm text-muted-foreground">Tap to track your progress</p>
            </Card>
          ) : (
            <>
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onEdit={handleGoalEdit} />
              ))}
              <Card
                className="p-6 border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors text-center bg-muted/50"
                onClick={() => {
                  setEditingGoal(undefined);
                  setGoalModalOpen(true);
                }}
              >
                <Plus className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm font-medium mt-2 text-muted-foreground">Add another goal</p>
              </Card>
            </>
          )}
        </div>
      </ContentWithLoading>

      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        onSave={handleGoalSave}
        goal={editingGoal}
      />
    </div>
  );
}
