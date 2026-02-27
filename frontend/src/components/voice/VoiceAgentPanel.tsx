import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { useSchedule } from '@/hooks/useSchedule';
import { useTransactions } from '@/hooks/useTransactions';
import { useEnergy } from '@/hooks/useEnergy';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useGoals } from '@/hooks/useGoals';
import { submitVoiceAudio, pollForVoiceResult, blobToBase64 } from '@/lib/voiceApi';
import { executeVoiceAction, type VoiceExecutorContext } from '@/lib/voiceActionExecutor';
import { toast } from '@/components/shared/ToastProvider';
import { LocalErrorBoundary } from '@/components/shared/LocalErrorBoundary';

interface VoiceAgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && !!window.MediaRecorder;
}

export function VoiceAgentPanel({ open, onOpenChange }: VoiceAgentPanelProps) {
  const { scheduleItems, addScheduleItems, updateScheduleItem, deleteScheduleItem, getScheduleItemById } = useSchedule();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, updateCheckIn, addCheckIn, deleteCheckIn, getCheckInByDate } = useEnergy();
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = isMediaRecorderSupported();

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

  const processRecording = useCallback(async () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (blob.size === 0) {
      setError('No audio recorded');
      return;
    }

    const base64 = await blobToBase64(blob);
    setIsProcessing(true);
    setError(null);

    try {
      const { jobId } = await submitVoiceAudio(base64, 'audio/webm');
      const result = await pollForVoiceResult(jobId);

      const succeeded: string[] = [];
      const failed: string[] = [];

      for (const action of result.actions) {
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
      setIsProcessing(false);
    }
  }, [voiceContext]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        void processRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to access microphone';
      setError(msg);
      toast.error('Microphone', { description: msg });
    }
  }, [processRecording]);

  useEffect(() => {
    if (!open) stopRecording();
  }, [open, stopRecording]);

  useEffect(() => () => stopRecording(), [stopRecording]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>מרח / Voice Agent</DialogTitle>
        </DialogHeader>
        <LocalErrorBoundary label="Voice">
        {!isSupported ? (
          <div className="py-4 text-sm text-muted-foreground">
            Voice is not supported in this browser. Please use Chrome or Edge.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {!isRecording && !isProcessing ? (
                <Button type="button" onClick={startRecording} className="flex-1">
                  <Mic className="mr-2 h-4 w-4" />
                  Start recording / התחל הקלטה
                </Button>
              ) : isRecording ? (
                <Button type="button" variant="destructive" onClick={stopRecording} className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  Stop / עצור
                </Button>
              ) : (
                <Button type="button" disabled className="flex-1">
                  Processing...
                </Button>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {isProcessing && (
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                Processing voice...
              </p>
            )}
          </div>
        )}
        </LocalErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
