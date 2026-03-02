import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubscription } from './useSubscription';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/core/api/subscription', () => ({
  subscriptionApi: {
    createCheckout: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/mock' }),
    createPortal: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/mock' }),
  },
}));

const { useAuth } = await import('@/context/AuthContext');

describe('useSubscription', () => {
  it('returns isPro=true when user has pro subscription', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'user', subscriptionStatus: 'pro' },
    });

    const { result } = renderHook(() => useSubscription());
    expect(result.current.isPro).toBe(true);
    expect(result.current.subscriptionStatus).toBe('pro');
  });

  it('returns isPro=false for free users', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'user', subscriptionStatus: 'free' },
    });

    const { result } = renderHook(() => useSubscription());
    expect(result.current.isPro).toBe(false);
    expect(result.current.subscriptionStatus).toBe('free');
  });

  it('returns isPro=false for canceled users', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'user', subscriptionStatus: 'canceled' },
    });

    const { result } = renderHook(() => useSubscription());
    expect(result.current.isPro).toBe(false);
  });

  it('returns isPro=false for past_due users', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'user', subscriptionStatus: 'past_due' },
    });

    const { result } = renderHook(() => useSubscription());
    expect(result.current.isPro).toBe(false);
  });

  it('defaults to free when no subscriptionStatus', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'user' },
    });

    const { result } = renderHook(() => useSubscription());
    expect(result.current.isPro).toBe(false);
    expect(result.current.subscriptionStatus).toBe('free');
  });
});
