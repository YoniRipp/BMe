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
import { CATEGORY_EMOJIS } from '@/types/schedule';
import { SCHEDULE_CATEGORIES } from '@/types/schedule';
import { understandTranscript } from '@/lib/voiceApi';
import { toast } from '@/components/shared/ToastProvider';

interface VoiceAgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANG_OPTIONS = [
  { value: 'he-IL', label: 'עברית' },
  { value: 'en-US', label: 'English' },
] as const;

function getSpeechRecognition(): typeof window.SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition
    ?? (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
    ?? null;
}

const VALID_CATEGORIES = new Set(SCHEDULE_CATEGORIES);

export function VoiceAgentPanel({ open, onOpenChange }: VoiceAgentPanelProps) {
  const { scheduleItems, addScheduleItem } = useSchedule();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lang, setLang] = useState<string>('he-IL');
  const recognitionRef = useRef<InstanceType<NonNullable<ReturnType<typeof getSpeechRecognition>>>>(null);
  const committedTranscriptRef = useRef('');

  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = !!SpeechRecognitionClass;

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
    rec.onresult = (event: globalThis.SpeechRecognitionEvent) => {
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
    rec.onerror = (event: globalThis.SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone and try again.');
      } else {
        setError(`Error: ${event.error}`);
      }
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
    if (!open) {
      stopListening();
    }
  }, [open]);

  useEffect(() => {
    return () => stopListening();
  }, []);

  const handleAddToSchedule = async () => {
    const text = transcript.trim();
    if (!text) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await understandTranscript(text, lang);
      if (result.intent === 'add_schedule' && result.title) {
        const category = VALID_CATEGORIES.has(result.category as typeof SCHEDULE_CATEGORIES[number])
          ? result.category
          : 'Other';
        addScheduleItem({
          title: result.title,
          startTime: result.startTime,
          endTime: result.endTime,
          category,
          emoji: CATEGORY_EMOJIS[category],
          order: scheduleItems.length,
          isActive: true,
        });
        toast.success(`Added to schedule: ${result.title}`, {
          description: `${result.startTime} – ${result.endTime}`,
        });
        setTranscript('');
        committedTranscriptRef.current = '';
      } else {
        setError('Could not detect "add to schedule" request. Try: "Add workout at 9" or "הוסף אימון ב-9".');
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
              <Select
                value={lang}
                onValueChange={setLang}
                disabled={isListening}
              >
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
                <Button
                  type="button"
                  onClick={startListening}
                  className="flex-1"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start listening / התחל האזנה
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopListening}
                  className="flex-1"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop / עצור
                </Button>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {(transcript || isListening) && (
              <div>
                <Label className="text-muted-foreground">
                  {isListening ? 'Listening... / מאזין...' : 'Transcript'}
                </Label>
                <div className="mt-1 min-h-[80px] rounded-md border bg-muted/50 p-3 text-sm">
                  {transcript || '—'}
                </div>
                {transcript.trim() && !isListening && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2 w-full"
                    onClick={handleAddToSchedule}
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Adding...' : 'Add to schedule / הוסף ללוח'}
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
