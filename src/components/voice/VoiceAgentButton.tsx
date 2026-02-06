import { useState, useRef, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchedule } from '@/hooks/useSchedule';
import { useTransactions } from '@/hooks/useTransactions';
import { useEnergy } from '@/hooks/useEnergy';
import { CATEGORY_EMOJIS, SCHEDULE_CATEGORIES } from '@/types/schedule';
import { TRANSACTION_CATEGORIES } from '@/types/transaction';
import { understandTranscript } from '@/lib/voiceApi';
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
  const { scheduleItems, addScheduleItems, deleteScheduleItem, getScheduleItemById } = useSchedule();
  const { addTransaction } = useTransactions();
  const { addFoodEntry, addCheckIn, updateCheckIn, getCheckInByDate } = useEnergy();
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<InstanceType<NonNullable<ReturnType<typeof getSpeechRecognition>>>>(null);
  const committedRef = useRef('');

  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = !!SpeechRecognitionClass;
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
    // Do not set state here; onend will set idle, or we're already processing
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) {
      toast.error('Voice not supported', {
        description: 'Please use Chrome or Edge.',
      });
      return;
    }
    setState('listening');
    setTranscript('');
    committedRef.current = '';
    const rec = new SpeechRecognitionClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event: globalThis.SpeechRecognitionEvent) => {
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
    rec.onerror = (event: globalThis.SpeechRecognitionErrorEvent) => {
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
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'VoiceAgentButton.tsx:result', message: 'Voice result', data: { intent: result.intent, transcript: text.slice(0, 60) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H5' }) }).catch(() => {});
        // #endregion

        switch (result.intent) {
          case 'add_schedule': {
            if (result.items?.length > 0) {
              let order = scheduleItems.length;
              const itemsToAdd = result.items.map((item) => {
                const category = VALID_SCHEDULE_CATEGORIES.has(item.category as (typeof SCHEDULE_CATEGORIES)[number])
                  ? item.category
                  : 'Other';
                return {
                  title: item.title,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  category,
                  emoji: CATEGORY_EMOJIS[category],
                  order: order++,
                  isActive: true,
                };
              });
              addScheduleItems(itemsToAdd);
              const n = result.items.length;
              const titlesPreview = result.items.map((i) => i.title).join(', ');
              toast.success(
                n === 1 ? `Added to schedule: ${result.items[0].title}` : `Added ${n} items to schedule`,
                { description: titlesPreview.length > 60 ? titlesPreview.slice(0, 57) + '...' : titlesPreview }
              );
            } else {
              toast.error('Could not add to schedule', { description: 'Say something like "Add workout at 9" or "הוסף אימון ב-9".' });
            }
            break;
          }
          case 'delete_schedule': {
            let targetId: string | undefined;
            if (result.itemId) {
              const byId = getScheduleItemById(result.itemId);
              if (byId) targetId = byId.id;
            }
            if (!targetId && result.itemTitle) {
              const titleLower = result.itemTitle.toLowerCase();
              const match = scheduleItems.find((s) => s.title.toLowerCase().includes(titleLower));
              if (match) targetId = match.id;
            }
            if (targetId) {
              deleteScheduleItem(targetId);
              toast.success('Removed from schedule');
            } else {
              toast.error('No matching schedule item');
            }
            break;
          }
          case 'add_transaction': {
            const category =
              result.type === 'income'
                ? (VALID_INCOME.has(result.category) ? result.category : 'Other')
                : (VALID_EXPENSE.has(result.category) ? result.category : 'Other');
            const date = parseDateOrToday(result.date);
            addTransaction({
              type: result.type,
              amount: result.amount >= 0 ? result.amount : 0,
              category,
              description: result.description,
              date,
              isRecurring: false,
            });
            toast.success('Added transaction');
            break;
          }
          case 'add_food': {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'VoiceAgentButton:add_food', message: 'Entered add_food', data: { result }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H5' }) }).catch(() => {});
            // #endregion
            const date = parseDateOrToday(result.date);
            addFoodEntry({
              name: result.name,
              calories: result.calories,
              protein: result.protein ?? 0,
              carbs: result.carbs ?? 0,
              fats: result.fats ?? 0,
              date,
            });
            toast.success('Logged food');
            break;
          }
          case 'log_sleep': {
            const date = parseDateOrToday(result.date);
            const existing = getCheckInByDate(date);
            if (existing) {
              updateCheckIn(existing.id, { sleepHours: result.sleepHours });
            } else {
              addCheckIn({ date, sleepHours: result.sleepHours });
            }
            toast.success('Logged sleep');
            break;
          }
          default: {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'VoiceAgentButton:default', message: 'Unknown intent', data: { intent: result.intent }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H5' }) }).catch(() => {});
            // #endregion
            toast.error('Could not understand', {
              description: 'Try: add workout, remove workout, add expense 50, log food salad 200 calories, slept 7 hours.',
            });
          }
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
