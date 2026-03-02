import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/core/api/subscription';

export function useSubscription() {
  const { user } = useAuth();
  const isPro = user?.subscriptionStatus === 'pro';

  const subscribe = useCallback(async () => {
    const { url } = await subscriptionApi.createCheckout();
    window.location.href = url;
  }, []);

  const manage = useCallback(async () => {
    const { url } = await subscriptionApi.createPortal();
    window.location.href = url;
  }, []);

  return {
    isPro,
    subscriptionStatus: user?.subscriptionStatus || 'free',
    subscribe,
    manage,
  };
}
