import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Money } from './Money';
import { TransactionProvider } from '@/context/TransactionContext';
import { AppProvider } from '@/context/AppContext';

// Mock the MonthlyChart component
vi.mock('@/components/money/MonthlyChart', () => ({
  MonthlyChart: () => <div data-testid="monthly-chart">Chart</div>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      <TransactionProvider>
        {children}
      </TransactionProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Money Page', () => {
  it('renders money page with transactions', () => {
    render(<Money />, { wrapper });
    expect(screen.getByText(/money/i)).toBeInTheDocument();
  });

  it('filters transactions by type', async () => {
    const user = userEvent.setup();
    render(<Money />, { wrapper });
    
    const incomeTab = screen.getByRole('tab', { name: /income/i });
    await user.click(incomeTab);
    
    // Should show income transactions
    await waitFor(() => {
      expect(incomeTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});
