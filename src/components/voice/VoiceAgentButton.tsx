import { useState, useRef, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchedule } from '@/hooks/useSchedule';
import { useTransactions } from '@/hooks/useTransactions';
import { useEnergy } from '@/hooks/useEnergy';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useGoals } from '@/hooks/useGoals';
import { CATEGORY_EMOJIS, SCHEDULE_CATEGORIES } from '@/types/schedule';
import { TRANSACTION_CATEGORIES } from '@/types/transaction';
import { understandTranscript, type VoiceAction } from '@/lib/voiceApi';
import { toast } from '@/components/shared/ToastProvider';
import { cn } from '@/lib/utils';

const VALID_SCHEDULE_CATEGORIES = new Set(SCHEDULE_CATEGORIES);
const VALID_INCOME = new Set(TRANSACTION_CATEGORIES.income);
const VALID_EXPENSE = new Set(TRANSACTION_CATEGORIES.expense);

function parseDateOrToday(dateStr?: string): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSpeechRecognition(): typeof window.SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
    ?? (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
    ?? null;
}

type State = 'idle' | 'listening' | 'processing';

export function VoiceAgentButton() {
  const { scheduleItems, addScheduleItems, updateScheduleItem, deleteScheduleItem, getScheduleItemById } = useSchedule();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, updateCheckIn, addCheckIn, deleteCheckIn, getCheckInByDate } = useEnergy();
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();

  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const committedRef = useRef('');

  const SpeechRecognitionClass = getSpeechRecognition();
  const lang = 'he-IL';

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) {
      toast.error('Voice not supported', { description: 'Please use Chrome or Edge.' });
      return;
    }
    setState('listening');
    setTranscript('');
    committedRef.current = '';
    const rec = new SpeechRecognitionClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          committedRef.current += text;
        } else {
          interim += text;
        }
      }
      setTranscript(committedRef.current + interim);
    };
    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Try again.');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow and try again.');
      } else {
        toast.error(`Error: ${event.error}`);
      }
      recognitionRef.current = null;
      setState('idle');
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setState((s) => (s === 'listening' ? 'idle' : s));
    };
    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start listening');
      setState('idle');
    }
  }, [SpeechRecognitionClass]);

  const executeAction = useCallback((action: VoiceAction): { success: boolean; message?: string } => {
    try {
      switch (action.intent) {
        case 'add_schedule': {
          if (!action.items?.length) return { success: false, message: 'No schedule items' };
          let order = scheduleItems.length;
          const validRecurrence = ['daily', 'weekdays', 'weekends'] as const;
          const itemsToAdd = action.items.map((item) => {
            const category = VALID_SCHEDULE_CATEGORIES.has(item.category as (typeof SCHEDULE_CATEGORIES)[number]) ? item.category : 'Other';
            const recurrence = item.recurrence && validRecurrence.includes(item.recurrence as typeof validRecurrence[number]) ? (item.recurrence as 'daily' | 'weekdays' | 'weekends') : undefined;
            return {
              title: item.title,
              startTime: item.startTime ?? '09:00',
              endTime: item.endTime ?? '10:00',
              category,
              emoji: CATEGORY_EMOJIS[category],
              order: order++,
              isActive: true,
              recurrence,
            };
          });
          addScheduleItems(itemsToAdd);
          return { success: true, message: `Added ${itemsToAdd.length} to schedule` };
        }
        case 'edit_schedule': {
          let targetId = action.itemId ? getScheduleItemById(action.itemId)?.id : undefined;
          if (!targetId && action.itemTitle) {
            const m = scheduleItems.find((s) => s.title.toLowerCase().includes(action.itemTitle!.toLowerCase()));
            targetId = m?.id;
          }
          if (!targetId) return { success: false, message: 'Schedule item not found' };
          const updates: Record<string, unknown> = {};
          if (action.startTime) updates.startTime = action.startTime;
          if (action.endTime) updates.endTime = action.endTime;
          if (action.title) updates.title = action.title;
          if (action.category) updates.category = action.category;
          if (Object.keys(updates).length === 0) return { success: false, message: 'No updates' };
          void updateScheduleItem(targetId, updates);
          return { success: true, message: 'Updated schedule' };
        }
        case 'delete_schedule': {
          let targetId = action.itemId ? getScheduleItemById(action.itemId)?.id : undefined;
          if (!targetId && action.itemTitle) {
            const m = scheduleItems.find((s) => s.title.toLowerCase().includes(action.itemTitle!.toLowerCase()));
            targetId = m?.id;
          }
          if (!targetId) return { success: false, message: 'Schedule item not found' };
          deleteScheduleItem(targetId);
          return { success: true, message: 'Removed from schedule' };
        }
        case 'add_transaction': {
          const category: string = action.type === 'income'
            ? (VALID_INCOME.has(action.category as (typeof TRANSACTION_CATEGORIES.income)[number]) ? action.category : 'Other')
            : (VALID_EXPENSE.has(action.category as (typeof TRANSACTION_CATEGORIES.expense)[number]) ? action.category : 'Other');
          addTransaction({
            type: action.type,
            amount: action.amount >= 0 ? action.amount : 0,
            category,
            description: action.description,
            date: parseDateOrToday(action.date),
            isRecurring: action.isRecurring ?? false,
          });
          return { success: true, message: 'Added transaction' };
        }
        case 'edit_transaction': {
          let target = action.transactionId ? transactions.find((t) => t.id === action.transactionId) : undefined;
          if (!target && action.description) {
            const desc = action.description.toLowerCase();
            target = transactions.find((t) => t.description?.toLowerCase().includes(desc));
            if (!target && action.date) {
              const d = parseDateOrToday(action.date).toISOString().slice(0, 10);
              target = transactions.find((t) => t.date.toISOString().slice(0, 10) === d && t.description?.toLowerCase().includes(desc));
            }
          }
          if (!target) return { success: false, message: 'Transaction not found' };
          const updates: Record<string, unknown> = {};
          if (action.type) updates.type = action.type;
          if (action.amount != null) updates.amount = action.amount;
          if (action.category) updates.category = action.category;
          if (action.description !== undefined) updates.description = action.description;
          if (action.date) updates.date = parseDateOrToday(action.date);
          if (Object.keys(updates).length === 0) return { success: false, message: 'No updates' };
          updateTransaction(target.id, updates);
          return { success: true, message: 'Updated transaction' };
        }
        case 'delete_transaction': {
          let target = action.transactionId ? transactions.find((t) => t.id === action.transactionId) : undefined;
          if (!target && action.description) {
            const desc = action.description.toLowerCase();
            target = transactions.find((t) => t.description?.toLowerCase().includes(desc));
          }
          if (!target) return { success: false, message: 'Transaction not found' };
          deleteTransaction(target.id);
          return { success: true, message: 'Removed transaction' };
        }
        case 'add_workout': {
          addWorkout({
            date: parseDateOrToday(action.date),
            title: action.title ?? 'Workout',
            type: (['strength', 'cardio', 'flexibility', 'sports'].includes(action.type) ? action.type : 'cardio') as 'strength' | 'cardio' | 'flexibility' | 'sports',
            durationMinutes: action.durationMinutes ?? 30,
            exercises: [],
            notes: action.notes,
          });
          return { success: true, message: 'Added workout' };
        }
        case 'edit_workout': {
          let target = action.workoutId ? workouts.find((w) => w.id === action.workoutId) : undefined;
          if (!target && action.workoutTitle) {
            const tl = action.workoutTitle.toLowerCase();
            target = workouts.find((w) => w.title.toLowerCase().includes(tl));
          }
          if (!target) return { success: false, message: 'Workout not found' };
          const updates: Record<string, unknown> = {};
          if (action.title) updates.title = action.title;
          if (action.type) updates.type = action.type;
          if (action.durationMinutes != null) updates.durationMinutes = action.durationMinutes;
          if (action.notes !== undefined) updates.notes = action.notes;
          if (action.date) updates.date = parseDateOrToday(action.date);
          if (Object.keys(updates).length === 0) return { success: false, message: 'No updates' };
          updateWorkout(target.id, updates);
          return { success: true, message: 'Updated workout' };
        }
        case 'delete_workout': {
          let target = action.workoutId ? workouts.find((w) => w.id === action.workoutId) : undefined;
          if (!target && action.workoutTitle) {
            const tl = action.workoutTitle.toLowerCase();
            target = workouts.find((w) => w.title.toLowerCase().includes(tl));
          }
          if (!target) return { success: false, message: 'Workout not found' };
          deleteWorkout(target.id);
          return { success: true, message: 'Removed workout' };
        }
        case 'add_food': {
          if (!action.name && !action.calories) return { success: false, message: 'Food not found in database' };
          addFoodEntry({
            date: parseDateOrToday(action.date),
            name: action.name ?? 'Unknown',
            calories: action.calories ?? 0,
            protein: action.protein ?? 0,
            carbs: action.carbs ?? 0,
            fats: action.fats ?? 0,
          });
          return { success: true, message: 'Logged food' };
        }
        case 'edit_food_entry': {
          let target = action.entryId ? foodEntries.find((e) => e.id === action.entryId) : undefined;
          if (!target && action.foodName) {
            const fn = action.foodName.toLowerCase();
            target = foodEntries.find((e) => e.name.toLowerCase().includes(fn));
          }
          if (!target) return { success: false, message: 'Food entry not found' };
          const updates: Record<string, unknown> = {};
          if (action.name) updates.name = action.name;
          if (action.calories != null) updates.calories = action.calories;
          if (action.protein != null) updates.protein = action.protein;
          if (action.carbs != null) updates.carbs = action.carbs;
          if (action.fats != null) updates.fats = action.fats;
          if (action.date) updates.date = parseDateOrToday(action.date);
          if (Object.keys(updates).length === 0) return { success: false, message: 'No updates' };
          updateFoodEntry(target.id, updates);
          return { success: true, message: 'Updated food entry' };
        }
        case 'delete_food_entry': {
          let target = action.entryId ? foodEntries.find((e) => e.id === action.entryId) : undefined;
          if (!target && action.foodName) {
            const fn = action.foodName.toLowerCase();
            target = foodEntries.find((e) => e.name.toLowerCase().includes(fn));
          }
          if (!target) return { success: false, message: 'Food entry not found' };
          deleteFoodEntry(target.id);
          return { success: true, message: 'Removed food entry' };
        }
        case 'log_sleep': {
          const date = parseDateOrToday(action.date);
          const existing = getCheckInByDate(date);
          if (existing) {
            updateCheckIn(existing.id, { sleepHours: action.sleepHours });
          } else {
            addCheckIn({ date, sleepHours: action.sleepHours });
          }
          return { success: true, message: 'Logged sleep' };
        }
        case 'edit_check_in': {
          if (!action.date) return { success: false, message: 'Date required' };
          const date = parseDateOrToday(action.date);
          const existing = getCheckInByDate(date);
          if (!existing) return { success: false, message: 'Check-in not found' };
          updateCheckIn(existing.id, { sleepHours: action.sleepHours });
          return { success: true, message: 'Updated sleep' };
        }
        case 'delete_check_in': {
          if (!action.date) return { success: false, message: 'Date required' };
          const date = parseDateOrToday(action.date);
          const existing = getCheckInByDate(date);
          if (!existing) return { success: false, message: 'Check-in not found' };
          deleteFoodEntry(existing.id);
          return { success: true, message: 'Removed sleep log' };
        }
        case 'add_goal': {
          addGoal({
            type: action.type as 'calories' | 'workouts' | 'savings',
            target: action.target,
            period: action.period as 'weekly' | 'monthly' | 'yearly',
          });
          return { success: true, message: 'Added goal' };
        }
        case 'edit_goal': {
          let target = action.goalId ? goals.find((g) => g.id === action.goalId) : undefined;
          if (!target && action.goalType) {
            target = goals.find((g) => g.type === action.goalType);
          }
          if (!target) return { success: false, message: 'Goal not found' };
          const updates: Record<string, unknown> = {};
          if (action.target != null) updates.target = action.target;
          if (action.period) updates.period = action.period;
          if (Object.keys(updates).length === 0) return { success: false, message: 'No updates' };
          updateGoal(target.id, updates);
          return { success: true, message: 'Updated goal' };
        }
        case 'delete_goal': {
          let target = action.goalId ? goals.find((g) => g.id === action.goalId) : undefined;
          if (!target && action.goalType) {
            target = goals.find((g) => g.type === action.goalType);
          }
          if (!target) return { success: false, message: 'Goal not found' };
          deleteGoal(target.id);
          return { success: true, message: 'Removed goal' };
        }
        default:
          return { success: false, message: 'Could not understand' };
      }
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }, [
    scheduleItems, addScheduleItems, updateScheduleItem, deleteScheduleItem, getScheduleItemById,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, updateCheckIn, addCheckIn, deleteCheckIn, getCheckInByDate,
    workouts, addWorkout, updateWorkout, deleteWorkout,
    goals, addGoal, updateGoal, deleteGoal,
  ]);

  const handleClick = async () => {
    if (state === 'listening') {
      const text = transcript.trim();
      if (!text) {
        toast.error('No speech captured. Try again.');
        stopListening();
        return;
      }
      setState('processing');
      stopListening();
      try {
        const result = await understandTranscript(text, lang);
        const succeeded: string[] = [];
        const failed: { action: string; reason: string }[] = [];

        for (const action of result.actions) {
          if (action.intent === 'unknown') {
            failed.push({ action: 'unknown', reason: 'Could not understand' });
            continue;
          }
          const r = executeAction(action);
          if (r.success) {
            succeeded.push(r.message ?? action.intent);
          } else {
            failed.push({ action: action.intent, reason: r.message ?? 'Failed' });
          }
        }

        if (succeeded.length > 0 && failed.length === 0) {
          toast.success(succeeded.length === 1 ? succeeded[0] : `Done: ${succeeded.join(', ')}`);
        } else if (succeeded.length > 0 && failed.length > 0) {
          toast.success(`Added ${succeeded.length} item(s). ${failed.length} failed: ${failed.map((f) => f.reason).join('; ')}`);
        } else if (failed.length > 0) {
          const msg = failed[0].reason;
          toast.error('Could not complete', { description: msg });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Network or server error';
        toast.error('Voice request failed', { description: msg });
      } finally {
        setState('idle');
        setTranscript('');
        committedRef.current = '';
      }
      return;
    }
    if (state === 'idle') {
      startListening();
    }
  };

  const isActive = state === 'listening' || state === 'processing';

  return (
    <Button
      size="icon"
      className={cn(
        'fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all md:right-6',
        isActive && 'animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      aria-label={state === 'listening' ? 'מרח - מאזין (לחץ לעצור ולשלוח)' : state === 'processing' ? 'מרח - מעבד' : 'מרח - Voice Agent (לחץ להאזנה)'}
      onClick={handleClick}
      disabled={state === 'processing'}
    >
      {state === 'processing' ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
}
