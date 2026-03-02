import { request } from './client';

export const subscriptionApi = {
  getStatus: () =>
    request<{ status: string; currentPeriodEnd: string | null }>('/api/subscription/status'),
  createCheckout: () =>
    request<{ url: string }>('/api/subscription/checkout', { method: 'POST' }),
  createPortal: () =>
    request<{ url: string }>('/api/subscription/portal', { method: 'POST' }),
};
