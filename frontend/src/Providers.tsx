import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { TransactionProvider } from './context/TransactionContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { EnergyProvider } from './context/EnergyContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { GroupProvider } from './context/GroupContext';
import { GoalsProvider } from './context/GoalsContext';
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
 * Compose an array of providers into a single wrapper to flatten nesting.
 */
function composeProviders(
  providers: React.FC<{ children: React.ReactNode }>[],
  children: React.ReactNode
): React.ReactElement {
  return providers.reduceRight<React.ReactElement>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    <>{children}</>
  );
}

const QCP: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

/**
 * Authenticated-app providers. Use only inside ProtectedRoutes after auth check.
 * Composed flat to reduce nesting depth and improve readability.
 */
const APP_PROVIDERS: React.FC<{ children: React.ReactNode }>[] = [
  QCP,
  AppProvider,
  TransactionProvider,
  WorkoutProvider,
  EnergyProvider,
  ScheduleProvider,
  GroupProvider,
  GoalsProvider,
  NotificationProvider,
];

export function AppProviders({ children }: { children: React.ReactNode }) {
  return composeProviders(APP_PROVIDERS, children);
}
