import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mic, Square, Send } from 'lucide-react';
import { useSchedule } from '@/hooks/useSchedule';
import { useTransactions } from '@/hooks/useTransactions';
import { useEnergy } from '@/hooks/useEnergy';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useGoals } from '@/hooks/useGoals';
import { CATEGORY_EMOJIS, SCHEDULE_CATEGORIES } from '@/types/schedule';
import { TRANSACTION_CATEGORIES } from '@/types/transaction';
import { understandTranscript, type VoiceAction } from '@/lib/voiceApi';
import { toast } from '@/components/shared/ToastProvider';

interface VoiceAgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANG_OPTIONS = [
  { value: 'he-IL', label: 'עברית' },
  { value: 'en-US', label: 'English' },
] as const;

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

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

export function VoiceAgentPanel({ open, onOpenChange }: VoiceAgentPanelProps) {
  const { scheduleItems, addScheduleItems, updateScheduleItem, deleteScheduleItem, getScheduleItemById } = useSchedule();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, updateCheckIn, addCheckIn, deleteCheckIn, getCheckInByDate } = useEnergy();
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lang, setLang] = useState<string>('he-IL');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const committedTranscriptRef = useRef('');

  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = !!SpeechRecognitionClass;

  const executeAction = (action: VoiceAction): { success: boolean; message?: string } => {
    try {
      switch (action.intent) {
        case 'add_schedule':
          if (!action.items?.length) return { success: false, message: 'No schedule items' };
          let order = scheduleItems.length;
          const validRecurrence = ['daily', 'weekdays', 'weekends'] as const;
          addScheduleItems(action.items.map((item) => {
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
          }));
          return { success: true, message: `Added ${action.items.length} to schedule` };
        case 'edit_schedule': {
          let targetId = action.itemId ? getScheduleItemById(action.itemId)?.id : undefined;
          if (!targetId && action.itemTitle) targetId = scheduleItems.find((s) => s.title.toLowerCase().includes(action.itemTitle!.toLowerCase()))?.id;
          if (!targetId) return { success: false, message: 'Schedule item not found' };
          const updates: Record<string, unknown> = {};
          if (action.startTime) updates.startTime = action.startTime;
          if (action.endTime) updates.endTime = action.endTime;
          if (action.title) updates.title = action.title;
          if (action.category) updates.category = action.category;
          if (Object.keys(updates).length > 0) void updateScheduleItem(targetId, updates);
          return { success: true };
        }
        case 'delete_schedule': {
          let targetId = action.itemId ? getScheduleItemById(action.itemId)?.id : undefined;
          if (!targetId && action.itemTitle) targetId = scheduleItems.find((s) => s.title.toLowerCase().includes(action.itemTitle!.toLowerCase()))?.id;
          if (!targetId) return { success: false, message: 'Schedule item not found' };
          deleteScheduleItem(targetId);
          return { success: true };
        }
        case 'add_transaction': {
          const category: string = action.type === 'income' ? (VALID_INCOME.has(action.category as (typeof TRANSACTION_CATEGORIES.income)[number]) ? action.category : 'Other') : (VALID_EXPENSE.has(action.category as (typeof TRANSACTION_CATEGORIES.expense)[number]) ? action.category : 'Other');
          addTransaction({ type: action.type, amount: action.amount >= 0 ? action.amount : 0, category, description: action.description, date: parseDateOrToday(action.date), isRecurring: action.isRecurring ?? false });
          return { success: true };
        }
        case 'edit_transaction': {
          const target = action.transactionId ? transactions.find((t) => t.id === action.transactionId) : transactions.find((t) => t.description?.toLowerCase().includes((action.description ?? '').toLowerCase()));
          if (!target) return { success: false, message: 'Transaction not found' };
          const updates: Record<string, unknown> = {};
          if (action.type) updates.type = action.type;
          if (action.amount != null) updates.amount = action.amount;
          if (action.category) updates.category = action.category;
          if (action.description !== undefined) updates.description = action.description;
          if (action.date) updates.date = parseDateOrToday(action.date);
          if (Object.keys(updates).length > 0) updateTransaction(target.id, updates);
          return { success: true };
        }
        case 'delete_transaction': {
          const target = action.transactionId ? transactions.find((t) => t.id === action.transactionId) : transactions.find((t) => t.description?.toLowerCase().includes((action.description ?? '').toLowerCase()));
          if (!target) return { success: false, message: 'Transaction not found' };
          deleteTransaction(target.id);
          return { success: true };
        }
        case 'add_workout':
          addWorkout({ date: parseDateOrToday(action.date), title: action.title ?? 'Workout', type: (['strength', 'cardio', 'flexibility', 'sports'].includes(action.type) ? action.type : 'cardio') as 'strength' | 'cardio' | 'flexibility' | 'sports', durationMinutes: action.durationMinutes ?? 30, exercises: [], notes: action.notes });
          return { success: true };
        case 'edit_workout': {
          const target = action.workoutId ? workouts.find((w) => w.id === action.workoutId) : workouts.find((w) => w.title.toLowerCase().includes((action.workoutTitle ?? '').toLowerCase()));
          if (!target) return { success: false, message: 'Workout not found' };
          const updates: Record<string, unknown> = {};
          if (action.title) updates.title = action.title;
          if (action.type) updates.type = action.type;
          if (action.durationMinutes != null) updates.durationMinutes = action.durationMinutes;
          if (action.notes !== undefined) updates.notes = action.notes;
          if (action.date) updates.date = parseDateOrToday(action.date);
          if (Object.keys(updates).length > 0) updateWorkout(target.id, updates);
          return { success: true };
        }
        case 'delete_workout': {
          const target = action.workoutId ? workouts.find((w) => w.id === action.workoutId) : workouts.find((w) => w.title.toLowerCase().includes((action.workoutTitle ?? '').toLowerCase()));
          if (!target) return { success: false, message: 'Workout not found' };
          deleteWorkout(target.id);
          return { success: true };
        }
        case 'add_food':
          if (!action.name && action.calories == null) return { success: false, message: 'Food not found' };
          addFoodEntry({ date: parseDateOrToday(action.date), name: action.name ?? 'Unknown', calories: action.calories ?? 0, protein: action.protein ?? 0, carbs: action.carbs ?? 0, fats: action.fats ?? 0 });
          return { success: true };
        case 'edit_food_entry': {
          const target = action.entryId ? foodEntries.find((e) => e.id === action.entryId) : foodEntries.find((e) => e.name.toLowerCase().includes((action.foodName ?? '').toLowerCase()));
          if (!target) return { success: false, message: 'Food entry not found' };
          const updates: Record<string, unknown> = {};
          if (action.name) updates.name = action.name;
          if (action.calories != null) updates.calories = action.calories;
          if (action.protein != null) updates.protein = action.protein;
          if (action.carbs != null) updates.carbs = action.carbs;
          if (action.fats != null) updates.fats = action.fats;
          if (action.date) updates.date = parseDateOrToday(action.date);
          if (Object.keys(updates).length > 0) updateFoodEntry(target.id, updates);
          return { success: true };
        }
        case 'delete_food_entry': {
          const target = action.entryId ? foodEntries.find((e) => e.id === action.entryId) : foodEntries.find((e) => e.name.toLowerCase().includes((action.foodName ?? '').toLowerCase()));
          if (!target) return { success: false, message: 'Food entry not found' };
          deleteFoodEntry(target.id);
          return { success: true };
        }
        case 'log_sleep': {
          const date = parseDateOrToday(action.date);
          const existing = getCheckInByDate(date);
          if (existing) updateCheckIn(existing.id, { sleepHours: action.sleepHours });
          else addCheckIn({ date, sleepHours: action.sleepHours });
          return { success: true };
        }
        case 'edit_check_in': {
          if (!action.date) return { success: false, message: 'Date required' };
          const existing = getCheckInByDate(parseDateOrToday(action.date));
          if (!existing) return { success: false, message: 'Check-in not found' };
          updateCheckIn(existing.id, { sleepHours: action.sleepHours });
          return { success: true };
        }
        case 'delete_check_in': {
          if (!action.date) return { success: false, message: 'Date required' };
          const existing = getCheckInByDate(parseDateOrToday(action.date));
          if (!existing) return { success: false, message: 'Check-in not found' };
          deleteCheckIn(existing.id);
          return { success: true };
        }
        case 'add_goal':
          addGoal({ type: action.type as 'calories' | 'workouts' | 'savings', target: action.target, period: action.period as 'weekly' | 'monthly' | 'yearly' });
          return { success: true };
        case 'edit_goal': {
          const target = action.goalId ? goals.find((g) => g.id === action.goalId) : goals.find((g) => g.type === action.goalType);
          if (!target) return { success: false, message: 'Goal not found' };
          const updates: Record<string, unknown> = {};
          if (action.target != null) updates.target = action.target;
          if (action.period) updates.period = action.period;
          if (Object.keys(updates).length > 0) updateGoal(target.id, updates);
          return { success: true };
        }
        case 'delete_goal': {
          const target = action.goalId ? goals.find((g) => g.id === action.goalId) : goals.find((g) => g.type === action.goalType);
          if (!target) return { success: false, message: 'Goal not found' };
          deleteGoal(target.id);
          return { success: true };
        }
        default:
          return { success: false, message: 'Could not understand' };
      }
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = () => {
    if (!SpeechRecognitionClass) return;
    setError(null);
    setTranscript('');
    committedTranscriptRef.current = '';
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
          committedTranscriptRef.current += text;
        } else {
          interim += text;
        }
      }
      setTranscript(committedTranscriptRef.current + interim);
    };
    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') setError('No speech detected. Try again.');
      else if (event.error === 'not-allowed') setError('Microphone access denied.');
      else setError(`Error: ${event.error}`);
      stopListening();
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start listening');
    }
  };

  useEffect(() => {
    if (!open) stopListening();
  }, [open]);

  useEffect(() => () => stopListening(), []);

  const handleExecute = async () => {
    const text = transcript.trim();
    if (!text) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await understandTranscript(text, lang);
      const succeeded: string[] = [];
      const failed: string[] = [];
      for (const action of result.actions) {
        if (action.intent === 'unknown') {
          failed.push('Could not understand');
          continue;
        }
        const r = executeAction(action);
        if (r.success) succeeded.push(r.message ?? action.intent);
        else failed.push(r.message ?? 'Failed');
      }
      if (succeeded.length > 0) {
        toast.success(succeeded.length === 1 ? succeeded[0] : `Done: ${succeeded.join(', ')}`);
        setTranscript('');
        committedTranscriptRef.current = '';
      }
      if (failed.length > 0) {
        setError(failed.join('; '));
      }
      if (succeeded.length === 0 && failed.length > 0) {
        setError(failed[0]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network or server error';
      setError(msg);
      toast.error('Voice request failed', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>מרח / Voice Agent</DialogTitle>
        </DialogHeader>

        {!isSupported ? (
          <div className="py-4 text-sm text-muted-foreground">
            Voice is not supported in this browser. Please use Chrome or Edge.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label>Language / שפה</Label>
              <Select value={lang} onValueChange={setLang} disabled={isListening}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANG_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {!isListening ? (
                <Button type="button" onClick={startListening} className="flex-1">
                  <Mic className="mr-2 h-4 w-4" />
                  Start listening / התחל האזנה
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopListening} className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  Stop / עצור
                </Button>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {(transcript || isListening) && (
              <div>
                <Label className="text-muted-foreground">
                  {isListening ? 'Listening... / מאזין...' : 'Transcript'}
                </Label>
                <div className="mt-1 min-h-[80px] rounded-md border bg-muted/50 p-3 text-sm">
                  {transcript || '—'}
                </div>
                {transcript.trim() && !isListening && (
                  <Button type="button" variant="secondary" className="mt-2 w-full" onClick={handleExecute} disabled={isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Processing...' : 'Execute / בצע'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
