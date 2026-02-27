import { useCallback, useRef, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface UseNativeSpeechOptions {
  language?: string;
  onPartialResult?: (transcript: string) => void;
}

interface UseNativeSpeechReturn {
  isNative: boolean;
  isAvailable: boolean;
  isListening: boolean;
  isProcessing: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  currentTranscript: string;
}

/**
 * Hook for native speech recognition using Capacitor plugin.
 * Uses Apple's Speech framework on iOS and Android's Speech API on Android.
 * Returns empty/no-op implementations when not running in a native context.
 */
export function useNativeSpeech(options: UseNativeSpeechOptions = {}): UseNativeSpeechReturn {
  const { language = 'he-IL', onPartialResult } = options;
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const transcriptRef = useRef('');

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      SpeechRecognition.available().then(({ available }) => {
        setIsAvailable(available);
      }).catch(() => {
        setIsAvailable(false);
      });
    }
  }, [isNative]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!isNative || !isAvailable) {
      throw new Error('Native speech recognition not available');
    }

    const permResult = await SpeechRecognition.requestPermissions();
    if (!permResult.speechRecognition || permResult.speechRecognition === 'denied') {
      throw new Error('Speech recognition permission denied');
    }

    transcriptRef.current = '';
    setCurrentTranscript('');
    setIsListening(true);

    await SpeechRecognition.addListener('partialResults', (data) => {
      const text = data.matches?.[0] ?? '';
      transcriptRef.current = text;
      setCurrentTranscript(text);
      onPartialResult?.(text);
    });

    await SpeechRecognition.start({
      language,
      partialResults: true,
      popup: false,
    });
  }, [isNative, isAvailable, language, onPartialResult]);

  const stopListening = useCallback(async (): Promise<string> => {
    if (!isNative) return '';

    try {
      await SpeechRecognition.stop();
    } catch {
      // Ignore stop errors
    }

    await SpeechRecognition.removeAllListeners();
    setIsListening(false);

    return transcriptRef.current;
  }, [isNative]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isNative && isListening) {
        SpeechRecognition.stop().catch(() => {});
        SpeechRecognition.removeAllListeners().catch(() => {});
      }
    };
  }, [isNative, isListening]);

  return {
    isNative,
    isAvailable: isNative && isAvailable,
    isListening,
    isProcessing: false,
    startListening,
    stopListening,
    currentTranscript,
  };
}
