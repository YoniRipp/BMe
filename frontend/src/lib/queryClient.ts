import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  goals: ['goals'] as const,
  transactions: ['transactions'] as const,
  schedule: ['schedule'] as const,
  workouts: ['workouts'] as const,
  checkIns: ['checkIns'] as const,
  foodEntries: ['foodEntries'] as const,
  groups: ['groups'] as const,
};
