import { getToken } from './api';
import { toLocalDateString } from './dateRanges';
import { parseVoiceAction, type VoiceAction, type VoiceScheduleItem } from '@/schemas/voice';

export type { VoiceAction, VoiceScheduleItem };

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

export interface VoiceUnderstandResult {
  actions: VoiceAction[];
}

export async function understandTranscript(
  transcript: string,
  lang?: string
): Promise<VoiceUnderstandResult> {
  const today = toLocalDateString(new Date());
  const timezone = getUserTimezone();
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceApi.ts:understandTranscript', message: 'sending today and timezone', data: { today, timezone }, timestamp: Date.now(), hypothesisId: 'H4' }) }).catch(() => {});
  // #endregion
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/voice/understand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        transcript: transcript.trim(),
        lang,
        today,
        timezone,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('NetworkError')) {
      throw new Error('Backend not reachable. Start the backend (e.g. npm run dev in backend/) and try again.');
    }
    throw e;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string })?.error ?? res.statusText;
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  const data = (await res.json()) as { actions?: unknown[] };
  const rawActions = Array.isArray(data.actions) ? data.actions : [];
  const actions: VoiceAction[] = [];
  for (const raw of rawActions) {
    if (raw && typeof raw === 'object') {
      const action = parseVoiceAction(raw);
      if (action.intent === 'add_schedule' && action.items.length === 0) {
        actions.push({ intent: 'unknown' });
      } else {
        actions.push(action);
      }
    }
  }
  if (actions.length === 0) {
    actions.push({ intent: 'unknown' });
  }
  return { actions };
}
