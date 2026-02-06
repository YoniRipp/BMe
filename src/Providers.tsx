import React from 'react';
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
 * Authenticated-app providers. Use only inside ProtectedRoutes after auth check.
 * Order: AppProvider → TransactionProvider → WorkoutProvider → EnergyProvider →
 * ScheduleProvider → GroupProvider → GoalsProvider → NotificationProvider → children.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <TransactionProvider>
        <WorkoutProvider>
          <EnergyProvider>
            <ScheduleProvider>
              <GroupProvider>
                <GoalsProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </GoalsProvider>
              </GroupProvider>
            </ScheduleProvider>
          </EnergyProvider>
        </WorkoutProvider>
      </TransactionProvider>
    </AppProvider>
  );
}
