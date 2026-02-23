import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Body } from './Body';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { AppProvider } from '@/context/AppContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' as const },
    authLoading: false,
  }),
}));

vi.mock('@/features/body/api', () => ({
  workoutsApi: {
    list: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WorkoutProvider>
          {children}
        </WorkoutProvider>
      </AppProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

describe('Body Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders body page', () => {
    render(<Body />, { wrapper });
    expect(screen.getByText(/body/i)).toBeInTheDocument();
  });

  it('shows workouts section', () => {
    render(<Body />, { wrapper });
    expect(screen.getByRole('heading', { name: /workouts/i })).toBeInTheDocument();
  });
});
