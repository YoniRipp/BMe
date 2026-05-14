import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeSpeech } from './useNativeSpeech';
import { useBrowserSpeech } from './useBrowserSpeech';

interface UseLiveTranscriptOptions {
  /**
   * BCP-47 language tag. Defaults to navigator.language with a fallback to he-IL
   * so Hebrew-set devices, English-set devices, and the meal voice logger all
   * get a usable locale without extra configuration.
   */
  lang?: string;
}

interface UseLiveTranscriptReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

function resolveLang(lang?: string): string {
  if (lang) return lang;
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
  return 'he-IL';
}

/**
 * Cross-platform live transcription hook used by the meal voice logger.
 *
 * - Native (iOS/Android via Capacitor) → Apple/Android Speech with partial
 *   results. Supports Hebrew, English, and other locales depending on the OS.
 * - Web → Web Speech API with interimResults so text appears while the user
 *   is still speaking.
 *
 * Mirrors the API of useBrowserSpeech so callers can swap it in directly.
 */
export function useLiveTranscript(options: UseLiveTranscriptOptions = {}): UseLiveTranscriptReturn {
  const lang = resolveLang(options.lang);
  const isNative = Capacitor.isNativePlatform();

  const native = useNativeSpeech({ language: lang });
  const browser = useBrowserSpeech({ lang });

  const useNativeImpl = isNative && native.isAvailable;

  const [error, setError] = useState<string | null>(null);
  const startedNativeRef = useRef(false);

  // Bubble browser-speech errors up so callers see them via the same `error` slot.
  useEffect(() => {
    if (!useNativeImpl && browser.error) setError(browser.error);
  }, [useNativeImpl, browser.error]);

  const start = useCallback(async () => {
    setError(null);
    if (useNativeImpl) {
      try {
        await native.startListening();
        startedNativeRef.current = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not start speech recognition';
        setError(msg);
      }
    } else {
      browser.start();
    }
  }, [useNativeImpl, native, browser]);

  const stop = useCallback(() => {
    if (useNativeImpl) {
      if (startedNativeRef.current) {
        native.stopListening().catch(() => {});
        startedNativeRef.current = false;
      }
    } else {
      browser.stop();
    }
  }, [useNativeImpl, native, browser]);

  const reset = useCallback(() => {
    setError(null);
    if (!useNativeImpl) browser.reset();
  }, [useNativeImpl, browser]);

  return {
    isListening: useNativeImpl ? native.isListening : browser.isListening,
    transcript: useNativeImpl ? native.currentTranscript : browser.transcript,
    error: useNativeImpl ? error : (error ?? browser.error),
    isSupported: useNativeImpl ? native.isAvailable : browser.isSupported,
    start,
    stop,
    reset,
  };
}
