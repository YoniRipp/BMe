import { useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { useExchangeRates } from '@/features/money/useExchangeRates';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useEnergy } from '@/hooks/useEnergy';
import { useSchedule } from '@/hooks/useSchedule';
import { useGoals } from '@/hooks/useGoals';
import { PageHeader } from '@/components/shared/PageHeader';
import { DashboardStats } from '@/components/home/DashboardStats';
import { ScheduleItem } from '@/components/home/ScheduleItem';
import { ScheduleModal } from '@/components/home/ScheduleModal';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalModal } from '@/components/goals/GoalModal';
import { ContentWithLoading } from '@/components/shared/ContentWithLoading';
import { Card } from '@/components/ui/card';
import { Home as HomeIcon, Plus } from 'lucide-react';
import { startOfMonth, endOfMonth, isAfter, isWithinInterval } from 'date-fns';
import { isScheduleItemPast } from '@/lib/utils';
import { getPeriodRange } from '@/lib/dateRanges';
import { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import { Goal } from '@/types/goals';

export function Home() {
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const { workouts } = useWorkouts();
  const { checkIns } = useEnergy();
  const { scheduleItems, scheduleLoading, scheduleError, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useSchedule();
  const { goals, goalsLoading, goalsError, addGoal, updateGoal } = useGoals();

  const displayCurrency = settings.currency;
  const fromCurrencies = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.currency ?? 'USD'))),
    [transactions]
  );
  const { convertToDisplay } = useExchangeRates(displayCurrency, fromCurrencies);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItemType | undefined>(undefined);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  // Calculate financial stats (converted to display currency)
  const { monthlyIncome, monthlyExpenses, balance } = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const monthly = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return isAfter(tDate, monthStart) && isAfter(monthEnd, tDate);
    });
    const income = monthly
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
    const expenses = monthly
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
    return {
      monthlyIncome: income,
      monthlyExpenses: expenses,
      balance: income - expenses,
    };
  }, [transactions, convertToDisplay]);

  // Calculate workout stats (current week = Sunday–Saturday)
  const { start: weekStart, end: weekEnd } = getPeriodRange('weekly', new Date());
  const workoutsThisWeek = workouts.filter(w => isWithinInterval(new Date(w.date), { start: weekStart, end: weekEnd })).length;

  // Calculate avg sleep (current week)
  const recentCheckIns = checkIns.filter(c => isWithinInterval(new Date(c.date), { start: weekStart, end: weekEnd }));
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
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Your life at a glance"
        icon={HomeIcon}
      />

      <div className="space-y-8">
        {/* Daily Schedule */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Daily Schedule</h2>
          <ContentWithLoading loading={scheduleLoading} loadingText="Loading schedule..." error={scheduleError}>
          <div className="space-y-2">
            {activeSchedule.length === 0 ? (
              <Card
                className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center"
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
          </ContentWithLoading>
        </div>

        {/* Stats row */}
        <DashboardStats
          workoutsThisWeek={workoutsThisWeek}
          avgEnergy={avgSleep}
          savingsRate={savingsRate}
        />

        {/* Goals */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Goals</h2>
          <ContentWithLoading loading={goalsLoading} loadingText="Loading goals..." error={goalsError}>
          <div className="space-y-3">
            {goals.length === 0 ? (
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
          </ContentWithLoading>
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
