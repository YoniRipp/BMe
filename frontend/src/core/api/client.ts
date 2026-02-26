/// <reference types="vite/client" />

import { STORAGE_KEYS } from '@/lib/storage';

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? '';

const DEFAULT_TIMEOUT_MS = 30000;

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

/** Call this when the API returns 401 so auth state is cleared and UI can redirect. */
export function handleUnauthorized(): void {
  setToken(null);
  try {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  } catch {
    // ignore
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: unknown;
  timeoutMs?: number;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const token = getToken();
  const authHeaders: HeadersInit = token ? { ...headers, Authorization: `Bearer ${token}` } : { ...headers };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    clearTimeout(timeoutId);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b94650'},body:JSON.stringify({sessionId:'b94650',location:'client.ts:fetch_catch',message:'Fetch threw',data:{path,err:String(e),name:e instanceof Error?e.name:'',url:`${API_BASE}${path}`},timestamp:Date.now(),hypothesisId:'H4_H5'})}).catch(()=>{});
    // #endregion
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw e;
  }
  clearTimeout(timeoutId);
  if (res.status === 401) {
    handleUnauthorized();
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Session expired');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = err.error ?? res.statusText;
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b94650'},body:JSON.stringify({sessionId:'b94650',location:'client.ts:!res.ok',message:'API error response',data:{status:res.status,path,msg,url:`${API_BASE}${path}`},timestamp:Date.now(),hypothesisId:'H1_H2_H3'})}).catch(()=>{});
    // #endregion
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
