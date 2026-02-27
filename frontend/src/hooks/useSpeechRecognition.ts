import { useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeSpeech } from './useNativeSpeech';
import { useWebSpeech } from './useWebSpeech';
import { understandTranscript, type VoiceUnderstandResult } from '@/lib/voiceApi';

interface UseSpeechRecognitionOptions {
  language?: string;
  onPartialResult?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  isNative: boolean;
  isAvailable: boolean;
  isListening: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  getVoiceResult: () => Promise<VoiceUnderstandResult>;
}

/**
 * Unified speech recognition hook that automatically selects the best
 * implementation based on the platform:
 * 
 * - Native iOS/Android: Uses Apple/Android Speech framework (real-time, ~200ms)
 * - Web browsers: Uses MediaRecorder + backend Gemini processing (~2-3s)
 * 
 * Provides a consistent API regardless of the underlying implementation.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { language = 'he-IL', onPartialResult } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceUnderstandResult | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const native = useNativeSpeech({ language, onPartialResult });
  const web = useWebSpeech({ language, onPartialResult });

  // Select the appropriate implementation
  const impl = isNative && native.isAvailable ? native : web;

  const startListening = useCallback(async (): Promise<void> => {
    setLastResult(null);
    await impl.startListening();
  }, [impl]);

  const stopListening = useCallback(async (): Promise<void> => {
    const transcript = await impl.stopListening();

    if (isNative && native.isAvailable) {
      // Native: we have a transcript, send to backend for Gemini understanding
      if (transcript.trim()) {
        setIsProcessing(true);
        try {
          const result = await understandTranscript(transcript, language);
          setLastResult(result);
        } catch (e) {
          console.error('Failed to understand transcript:', e);
          setLastResult({ actions: [{ intent: 'unknown' }] });
        } finally {
          setIsProcessing(false);
        }
      } else {
        setLastResult({ actions: [{ intent: 'unknown' }] });
      }
    } else {
      // Web: the result was already processed in useWebSpeech
      const webResult = await web.getVoiceResult();
      setLastResult(webResult);
    }
  }, [impl, isNative, native.isAvailable, web, language]);

  const getVoiceResult = useCallback(async (): Promise<VoiceUnderstandResult> => {
    return lastResult ?? { actions: [{ intent: 'unknown' }] };
  }, [lastResult]);

  return {
    isNative: isNative && native.isAvailable,
    isAvailable: impl.isAvailable,
    isListening: impl.isListening,
    isProcessing: isProcessing || impl.isProcessing,
    currentTranscript: impl.currentTranscript,
    startListening,
    stopListening,
    getVoiceResult,
  };
}
