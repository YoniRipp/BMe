/// <reference types="vite/client" />

import { STORAGE_KEYS } from '@/lib/storage';

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? 'http://localhost:3000';

export function getApiBase(): string {
  return API_BASE;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token == null) localStorage.removeItem(STORAGE_KEYS.TOKEN);
    else localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch {
    // ignore
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers } = options;
  const token = getToken();
  const authHeaders: HeadersInit = token
    ? { ...headers, Authorization: `Bearer ${token}` }
    : { ...headers };
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Auth
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: { email, password, name } }),
  me: () => request<ApiUser>('/api/auth/me'),
};

// Schedule
export interface ApiScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  emoji?: string;
  order: number;
  isActive: boolean;
  groupId?: string;
}

export const scheduleApi = {
  list: () => request<ApiScheduleItem[]>('/api/schedule'),
  add: (item: { title: string; startTime?: string; endTime?: string; category?: string; emoji?: string; order?: number; isActive?: boolean; groupId?: string }) =>
    request<ApiScheduleItem>('/api/schedule', { method: 'POST', body: item }),
  addBatch: (items: { title: string; startTime?: string; endTime?: string; category?: string; emoji?: string; groupId?: string }[]) =>
    request<ApiScheduleItem[]>('/api/schedule/batch', { method: 'POST', body: { items } }),
  update: (id: string, updates: Partial<{ title: string; startTime: string; endTime: string; category: string; emoji?: string; order: number; isActive: boolean; groupId?: string }>) =>
    request<ApiScheduleItem>(`/api/schedule/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/schedule/${id}`, { method: 'DELETE' }),
};

// Transactions
export interface ApiTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  isRecurring: boolean;
  groupId?: string;
}

export const transactionsApi = {
  list: (params?: { month?: string; type?: 'income' | 'expense' }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set('month', params.month);
    if (params?.type) q.set('type', params.type);
    const query = q.toString();
    return request<ApiTransaction[]>(`/api/transactions${query ? `?${query}` : ''}`);
  },
  add: (tx: { date?: string; type: 'income' | 'expense'; amount: number; category?: string; description?: string; isRecurring?: boolean; groupId?: string }) =>
    request<ApiTransaction>('/api/transactions', { method: 'POST', body: tx }),
  update: (id: string, updates: Partial<ApiTransaction>) =>
    request<ApiTransaction>(`/api/transactions/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
};

// Goals
export interface ApiGoal {
  id: string;
  type: string;
  target: number;
  period: string;
  createdAt: string;
}

export const goalsApi = {
  list: () => request<ApiGoal[]>('/api/goals'),
  add: (goal: { type: string; target: number; period: string }) =>
    request<ApiGoal>('/api/goals', { method: 'POST', body: goal }),
  update: (id: string, updates: Partial<{ type: string; target: number; period: string }>) =>
    request<ApiGoal>(`/api/goals/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/goals/${id}`, { method: 'DELETE' }),
};

// Workouts
export interface ApiWorkout {
  id: string;
  date: string;
  title: string;
  type: string;
  durationMinutes: number;
  exercises: { name: string; sets: number; reps: number; weight?: number; notes?: string }[];
  notes?: string;
}

export const workoutsApi = {
  list: () => request<ApiWorkout[]>('/api/workouts'),
  add: (w: { date?: string; title: string; type: string; durationMinutes: number; exercises?: ApiWorkout['exercises']; notes?: string }) =>
    request<ApiWorkout>('/api/workouts', { method: 'POST', body: w }),
  update: (id: string, updates: Partial<Omit<ApiWorkout, 'id'>>) =>
    request<ApiWorkout>(`/api/workouts/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/workouts/${id}`, { method: 'DELETE' }),
};

// Food entries
export interface ApiFoodEntry {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const foodEntriesApi = {
  list: () => request<ApiFoodEntry[]>('/api/food-entries'),
  add: (e: { date?: string; name: string; calories: number; protein: number; carbs: number; fats: number }) =>
    request<ApiFoodEntry>('/api/food-entries', { method: 'POST', body: e }),
  update: (id: string, updates: Partial<Omit<ApiFoodEntry, 'id'>>) =>
    request<ApiFoodEntry>(`/api/food-entries/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/food-entries/${id}`, { method: 'DELETE' }),
};

// Daily check-ins
export interface ApiDailyCheckIn {
  id: string;
  date: string;
  sleepHours?: number;
}

export const dailyCheckInsApi = {
  list: () => request<ApiDailyCheckIn[]>('/api/daily-check-ins'),
  add: (c: { date?: string; sleepHours?: number }) =>
    request<ApiDailyCheckIn>('/api/daily-check-ins', { method: 'POST', body: c }),
  update: (id: string, updates: Partial<Omit<ApiDailyCheckIn, 'id'>>) =>
    request<ApiDailyCheckIn>(`/api/daily-check-ins/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/daily-check-ins/${id}`, { method: 'DELETE' }),
};

// Food search (API Ninjas via backend). Values are per referenceGrams (usually 100g).
export interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  referenceGrams?: number;
}

export function searchFoods(query: string, limit = 10): Promise<FoodSearchResult[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return Promise.resolve([]);
  return request<FoodSearchResult[]>(`/api/food/search?q=${q}&limit=${Math.min(limit, 25)}`);
}

// Users (admin only)
export interface ApiUserListItem {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export const usersApi = {
  list: () => request<ApiUserListItem[]>('/api/users'),
  create: (u: { email: string; password: string; name: string; role?: 'admin' | 'user' }) =>
    request<ApiUserListItem>('/api/users', { method: 'POST', body: u }),
  update: (id: string, updates: { name?: string; role?: 'admin' | 'user'; password?: string }) =>
    request<ApiUserListItem>(`/api/users/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};
