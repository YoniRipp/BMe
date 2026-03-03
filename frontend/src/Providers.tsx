import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';

/**
 * Outer providers: error boundary, toasts, auth.
 * Order: ErrorBoundary → ToastProvider → AuthProvider → children (router).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider />
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}

/**
 * Authenticated-app providers. Use only inside ProtectedRoutes after auth check.
 *
 * Domain data (goals, workouts, energy, schedule, transactions, groups)
 * is now managed via direct React Query hooks — no context providers needed.
 * React Query's cache (via QueryClientProvider) shares data across components.
 *
 * Only AppProvider (user+settings) and NotificationProvider (browser APIs)
 * remain as contexts since they hold non-server state.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
