/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Web Speech API - not in TypeScript's DOM lib for all browsers
interface SpeechRecognitionEventMap {
  result: SpeechRecognitionEvent;
  error: SpeechRecognitionErrorEvent;
  end: Event;
  start: Event;
  audiostart: Event;
  audioend: Event;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface Window {
  SpeechRecognition?: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new (): SpeechRecognition;
  };
}
