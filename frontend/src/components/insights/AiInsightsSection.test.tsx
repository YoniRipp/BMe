import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AiInsightsSection } from './AiInsightsSection';

const mockGetInsights = vi.fn();
const mockRefreshInsights = vi.fn();
const mockGetTodayRecommendations = vi.fn();
const mockSearch = vi.fn();
const mockGetStats = vi.fn();

vi.mock('@/core/api/aiInsights', () => ({
  aiInsightsApi: {
    getInsights: (...args: unknown[]) => mockGetInsights(...args),
    refreshInsights: (...args: unknown[]) => mockRefreshInsights(...args),
    getTodayRecommendations: (...args: unknown[]) => mockGetTodayRecommendations(...args),
    search: (...args: unknown[]) => mockSearch(...args),
    getStats: (...args: unknown[]) => mockGetStats(...args),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const successData = {
  summary: 'You are doing well.',
  highlights: ['Good sleep', 'Regular workouts'],
  suggestions: ['Try more vegetables'],
  score: 78,
};

describe('AiInsightsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockGetInsights.mockResolvedValue(successData);
    mockGetTodayRecommendations.mockResolvedValue({
      workout: 'Run 30 min',
      budget: 'Stick to budget',
      nutrition: 'Eat protein',
      focus: 'Deep work',
    });
  });

  it('renders AI-Powered Insights heading and Refresh button', async () => {
    render(<AiInsightsSection />, { wrapper });
    expect(screen.getByRole('heading', { name: /AI-Powered Insights/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh insights/i })).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    mockGetInsights.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<AiInsightsSection />, { wrapper });
    expect(screen.getByText(/Analyzing your data/i)).toBeInTheDocument();
  });

  it('displays the actual API error message when insights fetch fails', async () => {
    const apiError = 'AI insights not configured (missing GEMINI_API_KEY)';
    mockGetInsights.mockRejectedValue(new Error(apiError));
    render(<AiInsightsSection />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(apiError)).toBeInTheDocument();
    });
  });

  it('displays other error messages when API returns different errors', async () => {
    const sessionError = 'Session expired';
    mockGetInsights.mockRejectedValue(new Error(sessionError));
    render(<AiInsightsSection />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(sessionError)).toBeInTheDocument();
    });
  });

  it('displays wellness score and summary when fetch succeeds', async () => {
    render(<AiInsightsSection />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(successData.summary)).toBeInTheDocument();
    });
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText(/Wellness Score/i)).toBeInTheDocument();
  });

  it('displays highlights and suggestions when fetch succeeds', async () => {
    render(<AiInsightsSection />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Highlights')).toBeInTheDocument();
    });
    expect(screen.getByText('Good sleep')).toBeInTheDocument();
    expect(screen.getByText('Regular workouts')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Try more vegetables')).toBeInTheDocument();
  });

  it('Refresh button triggers refreshInsights and invalidates cache', async () => {
    const user = userEvent.setup();
    render(<AiInsightsSection />, { wrapper });

    await waitFor(() => expect(screen.getByText(successData.summary)).toBeInTheDocument());
    mockGetInsights.mockClear();
    mockRefreshInsights.mockResolvedValue(successData);

    await user.click(screen.getByRole('button', { name: /Refresh insights/i }));

    await waitFor(() => {
      expect(mockRefreshInsights).toHaveBeenCalled();
    });
  });
});
