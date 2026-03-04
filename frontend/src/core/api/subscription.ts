import { request } from './client';

export const subscriptionApi = {
  getStatus: () =>
    request<{ status: string; currentPeriodEnd: string | null }>('/api/subscription/status'),
  createCheckout: (plan: 'monthly' | 'yearly' = 'monthly') =>
    request<{ url: string }>('/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
  createPortal: () =>
    request<{ url: string }>('/api/subscription/portal', { method: 'POST' }),
};
