import { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // TODO: Wire this to sync queue when implementing offline sync (PR #3)
  const [pendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show if PWA offline sync is enabled
  if (!FEATURE_FLAGS.PWA_OFFLINE_SYNC) {
    return null;
  }

  // Only show when offline or has pending items
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2">
      {!isOnline && (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You&apos;re offline. Changes will sync when reconnected.</span>
        </>
      )}
      {isOnline && pendingCount > 0 && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Syncing {pendingCount} pending changes...</span>
        </>
      )}
    </div>
  );
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
