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
import { understandTranscript } from '@/lib/voiceApi';
import { executeVoiceAction, type VoiceExecutorContext } from '@/lib/voiceActionExecutor';
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
        // #region agent log
        if (action.intent === 'add_food') fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'VoiceAgentPanel.tsx:beforeExecute', message: 'executing add_food', data: { intent: action.intent, name: (action as { name?: string }).name, calories: (action as { calories?: number }).calories }, timestamp: Date.now(), hypothesisId: 'H5' }) }).catch(() => {});
        // #endregion
        try {
          const r = await executeVoiceAction(action, voiceContext);
          if (r.success) succeeded.push(r.message ?? action.intent);
          else failed.push(r.message ?? 'Failed');
        } catch (e) {
          failed.push(e instanceof Error ? e.message : 'Action failed');
        }
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
