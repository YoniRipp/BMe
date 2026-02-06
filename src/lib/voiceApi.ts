const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface VoiceScheduleItem {
  title: string;
  startTime: string;
  endTime: string;
  category: string;
}

export type VoiceUnderstandResult =
  | { intent: 'add_schedule'; items: VoiceScheduleItem[] }
  | { intent: 'delete_schedule'; itemTitle?: string; itemId?: string }
  | {
      intent: 'add_transaction';
      type: 'income' | 'expense';
      amount: number;
      category: string;
      description?: string;
      date?: string;
    }
  | {
      intent: 'add_food';
      name: string;
      calories: number;
      protein?: number;
      carbs?: number;
      fats?: number;
      date?: string;
    }
  | { intent: 'log_sleep'; sleepHours: number; date?: string }
  | { intent: 'unknown' };

function normalizeItem(raw: {
  title?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  category?: unknown;
}): VoiceScheduleItem {
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    startTime: typeof raw.startTime === 'string' ? raw.startTime : '09:00',
    endTime: typeof raw.endTime === 'string' ? raw.endTime : '10:00',
    category: typeof raw.category === 'string' ? raw.category : 'Other',
  };
}

type BackendVoicePayload = {
  intent?: string;
  items?: unknown[];
  title?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
  itemTitle?: string;
  itemId?: string;
  type?: string;
  amount?: number;
  description?: string;
  date?: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  sleepHours?: number;
};

export async function understandTranscript(
  transcript: string,
  lang?: string
): Promise<VoiceUnderstandResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/voice/understand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: transcript.trim(), lang }),
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
  const data = (await res.json()) as BackendVoicePayload;
  const intent = data.intent ?? 'unknown';
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceApi.ts:data', message: 'Backend response received', data: { intent, keys: Object.keys(data), data }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H4' }) }).catch(() => {});
  // #endregion

  if (intent === 'add_schedule') {
    let items: VoiceScheduleItem[] = [];
    if (Array.isArray(data.items) && data.items.length > 0) {
      items = data.items
        .filter((it) => it && typeof (it as { title?: unknown }).title === 'string' && ((it as { title: string }).title).trim())
        .map((it) => normalizeItem(it as { title?: unknown; startTime?: unknown; endTime?: unknown; category?: unknown }));
    } else if (typeof data.title === 'string' && data.title.trim()) {
      items = [normalizeItem(data)];
    }
    return { intent: 'add_schedule', items };
  }

  if (intent === 'delete_schedule') {
    return {
      intent: 'delete_schedule',
      itemTitle: typeof data.itemTitle === 'string' ? data.itemTitle : undefined,
      itemId: typeof data.itemId === 'string' ? data.itemId : undefined,
    };
  }

  if (intent === 'add_transaction') {
    const type = data.type === 'income' || data.type === 'expense' ? data.type : 'expense';
    const amount = typeof data.amount === 'number' && data.amount >= 0 ? data.amount : 0;
    const category = typeof data.category === 'string' ? data.category : 'Other';
    return {
      intent: 'add_transaction',
      type,
      amount,
      category,
      description: typeof data.description === 'string' ? data.description : undefined,
      date: typeof data.date === 'string' ? data.date : undefined,
    };
  }

  if (intent === 'add_food') {
    const name = typeof data.name === 'string' ? data.name : '';
    const calories = typeof data.calories === 'number' && data.calories >= 0 ? data.calories : 0;
    return {
      intent: 'add_food',
      name,
      calories,
      protein: typeof data.protein === 'number' && data.protein >= 0 ? data.protein : 0,
      carbs: typeof data.carbs === 'number' && data.carbs >= 0 ? data.carbs : 0,
      fats: typeof data.fats === 'number' && data.fats >= 0 ? data.fats : 0,
      date: typeof data.date === 'string' ? data.date : undefined,
    };
  }

  if (intent === 'log_sleep') {
    const sleepHours = typeof data.sleepHours === 'number' && data.sleepHours >= 0 ? data.sleepHours : 0;
    const ret = { intent: 'log_sleep' as const, sleepHours, date: typeof data.date === 'string' ? data.date : undefined };
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceApi.ts:return', message: 'Returning result', data: { intent: ret.intent, result: ret }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H4' }) }).catch(() => {});
    // #endregion
    return ret;
  }

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceApi.ts:unknown', message: 'Fell through to unknown', data: { intent }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H4' }) }).catch(() => {});
  // #endregion
  return { intent: 'unknown' };
}
