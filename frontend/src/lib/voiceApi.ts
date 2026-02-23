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

async function getErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string })?.error ?? res.statusText ?? `Request failed: ${res.status}`;
}

function parseVoiceResult(data: { actions?: unknown[] } | null): VoiceUnderstandResult {
  const rawActions = Array.isArray(data?.actions) ? data.actions : [];
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Submit audio for voice processing. Returns jobId for polling. */
export async function submitVoiceAudio(
  audio: string,
  mimeType: string
): Promise<{ jobId: string; status: string }> {
  const today = toLocalDateString(new Date());
  const timezone = getUserTimezone();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/voice/understand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ audio, mimeType, today, timezone }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('NetworkError')) {
      throw new Error('Backend not reachable. Start the backend (e.g. npm run dev in backend/) and try again.');
    }
    throw e;
  }

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
}

/** Poll for voice job completion. */
export async function pollForVoiceResult(
  jobId: string,
  options?: { timeout?: number; interval?: number }
): Promise<VoiceUnderstandResult> {
  const timeout = options?.timeout ?? 30000;
  const interval = options?.interval ?? 500;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Job not found or expired');
      }
      throw new Error(await getErrorMessage(res));
    }

    const data = (await res.json()) as { status: string; result?: { actions?: unknown[] }; error?: string };

    if (data.status === 'completed') {
      return parseVoiceResult(data.result ?? null);
    }
    if (data.status === 'failed') {
      throw new Error(data.error ?? 'Voice processing failed');
    }

    await sleep(interval);
  }

  throw new Error('Voice processing timed out');
}

/** Convert Blob to base64 string (without data URL prefix). */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64 ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Legacy: Submit transcript for sync processing. Used by VoiceAgentButton when backend supports it. */
export async function understandTranscript(
  transcript: string,
  _lang?: string
): Promise<VoiceUnderstandResult> {
  const today = toLocalDateString(new Date());
  const timezone = getUserTimezone();

  const res = await fetch(`${API_BASE}/api/voice/understand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ transcript: transcript.trim(), today, timezone }),
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  const data = (await res.json()) as { actions?: unknown[]; jobId?: string };
  if (data.jobId) {
    return pollForVoiceResult(data.jobId);
  }
  return parseVoiceResult(data);
}
