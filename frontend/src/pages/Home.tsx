import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useEnergy } from '@/hooks/useEnergy';
import { useSchedule } from '@/hooks/useSchedule';
import { useGoals } from '@/hooks/useGoals';
import { DashboardProgressCards } from '@/components/home/DashboardProgressCards';
import { ScheduleItem } from '@/components/home/ScheduleItem';
import { ScheduleModal } from '@/components/home/ScheduleModal';
import { SleepEditModal } from '@/components/energy/SleepEditModal';
import { GoalModal } from '@/components/goals/GoalModal';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { ContentWithLoading } from '@/components/shared/ContentWithLoading';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { getGreeting } from '@/lib/utils';
import { format } from 'date-fns';
import { isScheduleItemPastUtc, utcScheduleToLocalDateStr } from '@/lib/utils';
import { ScheduleItem as ScheduleItemType } from '@/types/schedule';
import { Goal } from '@/types/goals';
import { toast } from 'sonner';

export function Home() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { checkIns, addCheckIn, updateCheckIn, getCheckInByDate } = useEnergy();
  const { scheduleItems, scheduleLoading, scheduleError, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useSchedule();
  const { addGoal, updateGoal } = useGoals();

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItemType | undefined>(undefined);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [deleteScheduleConfirmId, setDeleteScheduleConfirmId] = useState<string | null>(null);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayLabel = useMemo(() => format(new Date(), 'MMMM d'), []);

  const activeSchedule = useMemo(
    () =>
      scheduleItems
        .filter((item) => item.isActive && utcScheduleToLocalDateStr(item.date, item.startTime ?? '00:00') === todayStr)
        .sort((a, b) => {
          const aStart = a.startTime || '00:00';
          const bStart = b.startTime || '00:00';
          if (aStart !== bStart) return aStart.localeCompare(bStart);
          return (a.endTime || '00:00').localeCompare(b.endTime || '00:00');
        }),
    [scheduleItems, todayStr]
  );


  const handleScheduleSave = async (item: Omit<ScheduleItemType, 'id'>) => {
    try {
      if (editingSchedule) {
        await updateScheduleItem(editingSchedule.id, item);
        toast.success('Schedule item updated');
      } else {
        await addScheduleItem({ ...item, order: scheduleItems.length });
        toast.success('Schedule item added');
      }
      setEditingSchedule(undefined);
      setScheduleModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save schedule item. Please try again.');
    }
  };

  const handleScheduleEdit = (item: ScheduleItemType) => {
    setEditingSchedule(item);
    setScheduleModalOpen(true);
  };

  const handleGoalSave = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goal);
      toast.success('Goal updated');
    } else {
      addGoal(goal);
      toast.success('Goal added');
    }
    setEditingGoal(undefined);
  };

  const now = useMemo(() => new Date(), []);
  const todayCheckIn = useMemo(
    () => getCheckInByDate(now),
    [getCheckInByDate, checkIns, now]
  );

  const handleSleepSave = (hours: number) => {
    if (todayCheckIn) {
      updateCheckIn(todayCheckIn.id, { sleepHours: hours });
      toast.success('Sleep updated');
    } else {
      addCheckIn({ date: now, sleepHours: hours });
      toast.success('Sleep logged');
    }
    setSleepModalOpen(false);
  };

  const greeting = getGreeting();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero: greeting + date */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground mt-0.5">{todayLabel}</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Progress cards (goals) first, under main container */}
        <Card className="rounded-2xl overflow-hidden bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-5 sm:p-6">
            <SectionHeader title="Goals" subtitle="Today's progress" />
            <DashboardProgressCards
              onAddGoal={() => {
                setEditingGoal(undefined);
                setGoalModalOpen(true);
              }}
              onAddWorkout={() => navigate('/body')}
              onAddFood={() => navigate('/energy')}
              onAddSleep={() => setSleepModalOpen(true)}
            />
          </CardContent>
        </Card>

        {/* Today's Schedule second */}
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <SectionHeader
              title="Today's Schedule"
              subtitle={todayLabel}
            />
            <ContentWithLoading loading={scheduleLoading} loadingText="Loading schedule..." error={scheduleError}>
              <div className="space-y-2">
                {activeSchedule.length === 0 ? (
                  <Card
                    className="p-8 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors text-center"
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
                        isPast={isScheduleItemPastUtc(item.date, item.endTime ?? '00:00')}
                        onEdit={handleScheduleEdit}
                        onDelete={setDeleteScheduleConfirmId}
                        categoryColors={settings.scheduleCategoryColors}
                      />
                    ))}
                    <Card
                      className="p-6 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors text-center bg-muted/50"
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
          </CardContent>
        </Card>
      </div>

      <ScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        onSave={handleScheduleSave}
        item={editingSchedule}
        initialDate={todayStr}
      />

      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        onSave={handleGoalSave}
        goal={editingGoal}
      />

      <SleepEditModal
        open={sleepModalOpen}
        onOpenChange={setSleepModalOpen}
        onSave={handleSleepSave}
        currentHours={todayCheckIn?.sleepHours}
      />

      <ConfirmationDialog
        open={!!deleteScheduleConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteScheduleConfirmId(null); }}
        title="Delete schedule item"
        message="Are you sure you want to delete this schedule item? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteScheduleConfirmId) {
            deleteScheduleItem(deleteScheduleConfirmId);
            toast.success('Schedule item deleted');
          }
          setDeleteScheduleConfirmId(null);
        }}
      />
    </div>
  );
}
