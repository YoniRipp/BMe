import { useCallback, useRef, useState } from 'react';
import { submitVoiceAudio, pollForVoiceResult, blobToBase64, type VoiceUnderstandResult } from '@/lib/voiceApi';

interface UseWebSpeechOptions {
  language?: string;
  onPartialResult?: (transcript: string) => void;
}

interface UseWebSpeechReturn {
  isNative: boolean;
  isAvailable: boolean;
  isListening: boolean;
  isProcessing: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  currentTranscript: string;
  getVoiceResult: () => Promise<VoiceUnderstandResult | null>;
}

function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && !!window.MediaRecorder;
}

/**
 * Hook for web-based speech recognition using MediaRecorder + backend processing.
 * Falls back to this when native speech recognition is not available.
 * Records audio, sends to backend for Gemini transcription + understanding.
 */
export function useWebSpeech(options: UseWebSpeechOptions = {}): UseWebSpeechReturn {
  const { onPartialResult } = options;
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const lastResultRef = useRef<VoiceUnderstandResult | null>(null);

  const isAvailable = isMediaRecorderSupported();

  const startListening = useCallback(async (): Promise<void> => {
    if (!isAvailable) {
      throw new Error('MediaRecorder not supported in this browser');
    }

    audioChunksRef.current = [];
    lastResultRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);

      // Signal that we're recording (no real-time transcript for MediaRecorder)
      onPartialResult?.('Recording...');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to access microphone';
      throw new Error(msg);
    }
  }, [isAvailable, onPartialResult]);

  const stopListening = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      const stream = streamRef.current;

      if (!recorder || recorder.state === 'inactive') {
        setIsListening(false);
        resolve('');
        return;
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setIsListening(false);

        // Process the recording
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });

        if (blob.size === 0) {
          resolve('');
          return;
        }

        setIsProcessing(true);

        try {
          const base64 = await blobToBase64(blob);
          const { jobId } = await submitVoiceAudio(base64, mimeType);
          const result = await pollForVoiceResult(jobId);
          lastResultRef.current = result;

          // Extract transcript from the first action if available
          const firstAction = result.actions[0];
          let transcript = '';
          if (firstAction && firstAction.intent !== 'unknown') {
            transcript = `Processed: ${firstAction.intent}`;
          }

          setIsProcessing(false);
          resolve(transcript);
        } catch (e) {
          setIsProcessing(false);
          reject(e);
        }
      };

      recorder.stop();
    });
  }, []);

  const getVoiceResult = useCallback(async (): Promise<VoiceUnderstandResult | null> => {
    return lastResultRef.current;
  }, []);

  return {
    isNative: false,
    isAvailable,
    isListening,
    isProcessing,
    startListening,
    stopListening,
    currentTranscript: '',
    getVoiceResult,
  };
}
