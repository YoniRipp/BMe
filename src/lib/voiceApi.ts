import { getToken } from './api';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

export interface VoiceScheduleItem {
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  recurrence?: string;
}

/** A single action from the voice API. Discriminated by intent. */
export type VoiceAction =
  | { intent: 'add_schedule'; items: VoiceScheduleItem[] }
  | { intent: 'edit_schedule'; itemTitle?: string; itemId?: string; startTime?: string; endTime?: string; title?: string; category?: string }
  | { intent: 'delete_schedule'; itemTitle?: string; itemId?: string }
  | { intent: 'add_transaction'; type: 'income' | 'expense'; amount: number; category: string; description?: string; date?: string; isRecurring?: boolean }
  | { intent: 'edit_transaction'; description?: string; transactionId?: string; date?: string; type?: string; amount?: number; category?: string }
  | { intent: 'delete_transaction'; description?: string; transactionId?: string; date?: string }
  | { intent: 'add_workout'; date?: string; title: string; type: string; durationMinutes: number; notes?: string }
  | { intent: 'edit_workout'; workoutTitle?: string; workoutId?: string; date?: string; title?: string; type?: string; durationMinutes?: number; notes?: string }
  | { intent: 'delete_workout'; workoutTitle?: string; workoutId?: string; date?: string }
  | { intent: 'add_food'; name?: string; calories?: number; protein?: number; carbs?: number; fats?: number; food?: string; amount?: number; unit?: string; date?: string }
  | { intent: 'edit_food_entry'; foodName?: string; entryId?: string; date?: string; name?: string; calories?: number; protein?: number; carbs?: number; fats?: number }
  | { intent: 'delete_food_entry'; foodName?: string; entryId?: string; date?: string }
  | { intent: 'log_sleep'; sleepHours: number; date?: string }
  | { intent: 'edit_check_in'; date?: string; sleepHours?: number }
  | { intent: 'delete_check_in'; date?: string }
  | { intent: 'add_goal'; type: string; target: number; period: string }
  | { intent: 'edit_goal'; goalType?: string; goalId?: string; target?: number; period?: string }
  | { intent: 'delete_goal'; goalType?: string; goalId?: string }
  | { intent: 'unknown' };

export interface VoiceUnderstandResult {
  actions: VoiceAction[];
}

function normalizeItem(raw: Record<string, unknown>): VoiceScheduleItem {
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    startTime: typeof raw.startTime === 'string' ? raw.startTime : '09:00',
    endTime: typeof raw.endTime === 'string' ? raw.endTime : '10:00',
    category: typeof raw.category === 'string' ? raw.category : 'Other',
    recurrence: typeof raw.recurrence === 'string' ? raw.recurrence : undefined,
  };
}

function parseAction(raw: Record<string, unknown>): VoiceAction | null {
  const intent = typeof raw.intent === 'string' ? raw.intent : 'unknown';
  if (intent === 'unknown') return { intent: 'unknown' };

  if (intent === 'add_schedule') {
    const items = Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[])
          .filter((it) => it && typeof (it as { title?: unknown }).title === 'string')
          .map((it) => normalizeItem(it as Record<string, unknown>))
      : [];
    if (items.length === 0) return null;
    return { intent: 'add_schedule', items };
  }

  if (intent === 'edit_schedule') {
    return {
      intent: 'edit_schedule',
      itemTitle: typeof raw.itemTitle === 'string' ? raw.itemTitle : undefined,
      itemId: typeof raw.itemId === 'string' ? raw.itemId : undefined,
      startTime: typeof raw.startTime === 'string' ? raw.startTime : undefined,
      endTime: typeof raw.endTime === 'string' ? raw.endTime : undefined,
      title: typeof raw.title === 'string' ? raw.title : undefined,
      category: typeof raw.category === 'string' ? raw.category : undefined,
    };
  }

  if (intent === 'delete_schedule') {
    return {
      intent: 'delete_schedule',
      itemTitle: typeof raw.itemTitle === 'string' ? raw.itemTitle : undefined,
      itemId: typeof raw.itemId === 'string' ? raw.itemId : undefined,
    };
  }

  if (intent === 'add_transaction') {
    const type = raw.type === 'income' || raw.type === 'expense' ? raw.type : 'expense';
    const amount = typeof raw.amount === 'number' && raw.amount >= 0 ? raw.amount : 0;
    return {
      intent: 'add_transaction',
      type,
      amount,
      category: typeof raw.category === 'string' ? raw.category : 'Other',
      description: typeof raw.description === 'string' ? raw.description : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
      isRecurring: !!raw.isRecurring,
    };
  }

  if (intent === 'edit_transaction') {
    return {
      intent: 'edit_transaction',
      description: typeof raw.description === 'string' ? raw.description : undefined,
      transactionId: typeof raw.transactionId === 'string' ? raw.transactionId : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
      type: typeof raw.type === 'string' ? raw.type : undefined,
      amount: typeof raw.amount === 'number' ? raw.amount : undefined,
      category: typeof raw.category === 'string' ? raw.category : undefined,
    };
  }

  if (intent === 'delete_transaction') {
    return {
      intent: 'delete_transaction',
      description: typeof raw.description === 'string' ? raw.description : undefined,
      transactionId: typeof raw.transactionId === 'string' ? raw.transactionId : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
    };
  }

  if (intent === 'add_workout') {
    return {
      intent: 'add_workout',
      date: typeof raw.date === 'string' ? raw.date : undefined,
      title: typeof raw.title === 'string' ? raw.title : 'Workout',
      type: typeof raw.type === 'string' ? raw.type : 'cardio',
      durationMinutes: typeof raw.durationMinutes === 'number' ? raw.durationMinutes : 30,
      notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    };
  }

  if (intent === 'edit_workout') {
    return {
      intent: 'edit_workout',
      workoutTitle: typeof raw.workoutTitle === 'string' ? raw.workoutTitle : undefined,
      workoutId: typeof raw.workoutId === 'string' ? raw.workoutId : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
      title: typeof raw.title === 'string' ? raw.title : undefined,
      type: typeof raw.type === 'string' ? raw.type : undefined,
      durationMinutes: typeof raw.durationMinutes === 'number' ? raw.durationMinutes : undefined,
      notes: raw.notes !== undefined ? String(raw.notes) : undefined,
    };
  }

  if (intent === 'delete_workout') {
    return {
      intent: 'delete_workout',
      workoutTitle: typeof raw.workoutTitle === 'string' ? raw.workoutTitle : undefined,
      workoutId: typeof raw.workoutId === 'string' ? raw.workoutId : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
    };
  }

  if (intent === 'add_food') {
    return {
      intent: 'add_food',
      name: typeof raw.name === 'string' ? raw.name : undefined,
      calories: typeof raw.calories === 'number' ? raw.calories : undefined,
      protein: typeof raw.protein === 'number' ? raw.protein : undefined,
      carbs: typeof raw.carbs === 'number' ? raw.carbs : undefined,
      fats: typeof raw.fats === 'number' ? raw.fats : undefined,
      food: typeof raw.food === 'string' ? raw.food : undefined,
      amount: typeof raw.amount === 'number' ? raw.amount : undefined,
      unit: typeof raw.unit === 'string' ? raw.unit : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
    };
  }

  if (intent === 'edit_food_entry') {
    return {
      intent: 'edit_food_entry',
      foodName: typeof raw.foodName === 'string' ? raw.foodName : undefined,
      entryId: typeof raw.entryId === 'string' ? raw.entryId : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
      name: typeof raw.name === 'string' ? raw.name : undefined,
      calories: typeof raw.calories === 'number' ? raw.calories : undefined,
      protein: typeof raw.protein === 'number' ? raw.protein : undefined,
      carbs: typeof raw.carbs === 'number' ? raw.carbs : undefined,
      fats: typeof raw.fats === 'number' ? raw.fats : undefined,
    };
  }

  if (intent === 'delete_food_entry') {
    return {
      intent: 'delete_food_entry',
      foodName: typeof raw.foodName === 'string' ? raw.foodName : undefined,
      entryId: typeof raw.entryId === 'string' ? raw.entryId : undefined,
      date: typeof raw.date === 'string' ? raw.date : undefined,
    };
  }

  if (intent === 'log_sleep') {
    const sleepHours = typeof raw.sleepHours === 'number' && raw.sleepHours >= 0 ? raw.sleepHours : 0;
    return {
      intent: 'log_sleep',
      sleepHours,
      date: typeof raw.date === 'string' ? raw.date : undefined,
    };
  }

  if (intent === 'edit_check_in') {
    return {
      intent: 'edit_check_in',
      date: typeof raw.date === 'string' ? raw.date : undefined,
      sleepHours: typeof raw.sleepHours === 'number' ? raw.sleepHours : undefined,
    };
  }

  if (intent === 'delete_check_in') {
    return {
      intent: 'delete_check_in',
      date: typeof raw.date === 'string' ? raw.date : undefined,
    };
  }

  if (intent === 'add_goal') {
    return {
      intent: 'add_goal',
      type: typeof raw.type === 'string' ? raw.type : 'workouts',
      target: typeof raw.target === 'number' ? raw.target : 0,
      period: typeof raw.period === 'string' ? raw.period : 'weekly',
    };
  }

  if (intent === 'edit_goal') {
    return {
      intent: 'edit_goal',
      goalType: typeof raw.goalType === 'string' ? raw.goalType : undefined,
      goalId: typeof raw.goalId === 'string' ? raw.goalId : undefined,
      target: typeof raw.target === 'number' ? raw.target : undefined,
      period: typeof raw.period === 'string' ? raw.period : undefined,
    };
  }

  if (intent === 'delete_goal') {
    return {
      intent: 'delete_goal',
      goalType: typeof raw.goalType === 'string' ? raw.goalType : undefined,
      goalId: typeof raw.goalId === 'string' ? raw.goalId : undefined,
    };
  }

  return { intent: 'unknown' };
}

export async function understandTranscript(
  transcript: string,
  lang?: string
): Promise<VoiceUnderstandResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/voice/understand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
  const data = (await res.json()) as { actions?: unknown[] };
  const rawActions = Array.isArray(data.actions) ? data.actions : [];
  const actions: VoiceAction[] = [];
  for (const raw of rawActions) {
    if (raw && typeof raw === 'object') {
      const action = parseAction(raw as Record<string, unknown>);
      if (action) actions.push(action);
    }
  }
  if (actions.length === 0) {
    actions.push({ intent: 'unknown' });
  }
  return { actions };
}
