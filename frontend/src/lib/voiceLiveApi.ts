import { getApiBase, getToken } from '@/core/api/client';

export type VoiceLiveMessage =
  | { type: 'connected' }
  | { type: 'audio'; data: string }
  | { type: 'turnComplete' }
  | { type: 'error'; error: string }
  | { type: 'closed'; reason?: string };

export function getVoiceLiveWsUrl(): string {
  const base = getApiBase();
  const wsScheme = base.startsWith('https') ? 'wss' : 'ws';
  const wsHost = base.replace(/^https?:\/\//, '');
  const token = getToken();
  return `${wsScheme}://${wsHost}/api/voice/live${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

const SEND_SAMPLE_RATE = 16000;
const RECV_SAMPLE_RATE = 24000;

export const VOICE_LIVE_AUDIO = {
  SEND_SAMPLE_RATE,
  RECV_SAMPLE_RATE,
} as const;
