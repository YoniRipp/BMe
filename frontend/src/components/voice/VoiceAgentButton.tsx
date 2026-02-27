import { useState, useRef, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchedule } from '@/hooks/useSchedule';
import { useTransactions } from '@/hooks/useTransactions';
import { useEnergy } from '@/hooks/useEnergy';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useGoals } from '@/hooks/useGoals';
import { understandTranscript } from '@/lib/voiceApi';
import { executeVoiceAction, type VoiceExecutorContext } from '@/lib/voiceActionExecutor';
import { toast } from '@/components/shared/ToastProvider';
import { cn } from '@/lib/utils';

function getSpeechRecognition(): typeof window.SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
    ?? (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
    ?? null;
}

type State = 'idle' | 'listening' | 'processing';

interface VoiceAgentButtonProps {
  /** When provided, the button only toggles the voice panel (one tap open, one tap close). */
  panelOpen?: boolean;
  onTogglePanel?: () => void;
}

export function VoiceAgentButton({ panelOpen, onTogglePanel }: VoiceAgentButtonProps = {}) {
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

  const voiceContext = {
    scheduleItems,
    addScheduleItems,
    updateScheduleItem,
    deleteScheduleItem,
    getScheduleItemById,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    foodEntries,
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    addCheckIn,
    updateCheckIn,
    deleteCheckIn,
    getCheckInByDate,
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  } as VoiceExecutorContext;

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

  const handleClick = async () => {
    if (onTogglePanel != null) {
      onTogglePanel();
      return;
    }
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
          try {
            const r = await executeVoiceAction(action, voiceContext);
            if (r.success) {
              succeeded.push(r.message ?? action.intent);
            } else {
              failed.push({ action: action.intent, reason: r.message ?? 'Failed' });
            }
          } catch (e) {
            failed.push({ action: action.intent ?? 'unknown', reason: e instanceof Error ? e.message : 'Action failed' });
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

  const isActive = onTogglePanel != null ? panelOpen : state === 'listening' || state === 'processing';

  return (
    <Button
      size="icon"
      className={cn(
        'fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all md:right-6',
        isActive && 'animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      aria-label={
        onTogglePanel != null
          ? panelOpen
            ? 'מרח - לחץ לסגירה'
            : 'מרח - Voice Agent (לחץ לפתיחה)'
          : state === 'listening'
            ? 'מרח - מאזין (לחץ לעצור ולשלוח)'
            : state === 'processing'
              ? 'מרח - מעבד'
              : 'מרח - Voice Agent (לחץ להאזנה)'
      }
      onClick={handleClick}
      disabled={onTogglePanel == null && state === 'processing'}
    >
      {onTogglePanel == null && state === 'processing' ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
}
