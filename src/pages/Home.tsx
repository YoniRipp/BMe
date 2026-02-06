import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useEnergy } from '@/hooks/useEnergy';
import { useSchedule } from '@/hooks/useSchedule';
import { useGoals } from '@/hooks/useGoals';
import { PageHeader } from '@/components/shared/PageHeader';
import { FinancialSummary } from '@/components/home/FinancialSummary';
import { DashboardStats } from '@/components/home/DashboardStats';
import { ScheduleItem } from '@/components/home/ScheduleItem';
import { ScheduleModal } from '@/components/home/ScheduleModal';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalModal } from '@/components/goals/GoalModal';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card } from '@/components/ui/card';
import { Home as HomeIcon, Plus } from 'lucide-react';
import { startOfMonth, endOfMonth, subDays, isAfter } from 'date-fns';
import { isScheduleItemPast } from '@/lib/utils';
import { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import { Goal } from '@/types/goals';

export function Home() {
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { checkIns } = useEnergy();
  const { scheduleItems, scheduleLoading, scheduleError, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useSchedule();
  const { goals, goalsLoading, goalsError, addGoal, updateGoal } = useGoals();

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItemType | undefined>(undefined);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  // Calculate financial stats
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const monthlyTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return isAfter(tDate, monthStart) && isAfter(monthEnd, tDate);
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = monthlyIncome - monthlyExpenses;

  // Calculate workout stats
  const weekAgo = subDays(new Date(), 7);
  const workoutsThisWeek = workouts.filter(w => isAfter(new Date(w.date), weekAgo)).length;

  // Calculate avg sleep (replacing energy level)
  const recentCheckIns = checkIns.filter(c => isAfter(new Date(c.date), weekAgo));
  const avgSleep = recentCheckIns.length > 0
    ? recentCheckIns.reduce((sum, c) => sum + (c.sleepHours || 0), 0) / recentCheckIns.length
    : 0;

  // Calculate savings rate
  const savingsRate = monthlyIncome > 0 ? Math.round((balance / monthlyIncome) * 100) : 0;

  const activeSchedule = scheduleItems
    .filter(item => item.isActive)
    .sort((a, b) => {
      const aStart = a.startTime || '00:00';
      const bStart = b.startTime || '00:00';
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      return (a.endTime || '00:00').localeCompare(b.endTime || '00:00');
    });

  const handleScheduleSave = async (item: Omit<ScheduleItemType, 'id'>) => {
    try {
      if (editingSchedule) {
        await updateScheduleItem(editingSchedule.id, item);
      } else {
        await addScheduleItem({ ...item, order: scheduleItems.length });
      }
      setEditingSchedule(undefined);
      setScheduleModalOpen(false);
    } catch {
      // Error already set in context; keep modal open
    }
  };

  const handleScheduleEdit = (item: ScheduleItemType) => {
    setEditingSchedule(item);
    setScheduleModalOpen(true);
  };

  const handleGoalSave = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goal);
    } else {
      addGoal(goal);
    }
    setEditingGoal(undefined);
  };

  const handleGoalEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  };

  return (
    <div className="space-y-6" data-onboarding="home">
      <OnboardingTour />
      <PageHeader
        title="Dashboard"
        subtitle="Your life at a glance"
        icon={HomeIcon}
      />

      {/* Daily Schedule - moved to top */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Daily Schedule</h2>
        {scheduleError && <p className="text-sm text-destructive mb-2">{scheduleError}</p>}
        <div className="space-y-2">
          {scheduleLoading ? (
            <LoadingSpinner text="Loading schedule..." />
          ) : activeSchedule.length === 0 ? (
            <Card 
              className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center"
              data-onboarding="add-schedule"
              onClick={() => {
                setEditingSchedule(undefined);
                setScheduleModalOpen(true);
              }}
            >
              <Plus className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">Add your first schedule item</p>
              <p className="text-sm text-muted-foreground">Tap to create a daily routine</p>
            </Card>
          ) : (
            <>
              {activeSchedule.map((item) => (
                <ScheduleItem
                  key={item.id}
                  item={item}
                  isPast={isScheduleItemPast(item.endTime)}
                  onEdit={handleScheduleEdit}
                  onDelete={deleteScheduleItem}
                />
              ))}
              <Card 
                className="p-6 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center bg-muted/50"
                onClick={() => {
                  setEditingSchedule(undefined);
                  setScheduleModalOpen(true);
                }}
              >
                <Plus className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm font-medium mt-2 text-muted-foreground">Add another schedule item</p>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Dashboard Stats - workouts, sleep, savings rate */}
      <DashboardStats
        workoutsThisWeek={workoutsThisWeek}
        avgEnergy={avgSleep}
        savingsRate={savingsRate}
      />

      {/* Current Balance */}
      <FinancialSummary
        balance={balance}
        income={monthlyIncome}
        expenses={monthlyExpenses}
      />

      {/* Goals Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Goals</h2>
        {goalsError && <p className="text-sm text-destructive mb-2">{goalsError}</p>}
        <div className="space-y-3">
          {goalsLoading ? (
            <LoadingSpinner text="Loading goals..." />
          ) : goals.length === 0 ? (
            <Card 
              className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center"
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
                className="p-6 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center bg-muted/50"
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
      </div>

      <ScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        onSave={handleScheduleSave}
        item={editingSchedule}
      />

      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        onSave={handleGoalSave}
        goal={editingGoal}
      />
    </div>
  );
}
