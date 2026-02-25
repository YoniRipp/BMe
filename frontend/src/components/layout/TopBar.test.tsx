import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TopBar } from './TopBar';

const mockLogout = vi.fn();

vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui/sidebar')>();
  return {
    ...mod,
    SidebarTrigger: () => <span data-testid="sidebar-trigger" />,
  };
});

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'user' as const },
    settings: { currency: 'USD', dateFormat: 'MM/dd/yyyy', balanceDisplayLayout: 'compact' as const },
    updateSettings: vi.fn(),
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { currency: 'USD', dateFormat: 'MM/dd/yyyy', balanceDisplayLayout: 'compact' as const },
    updateSettings: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => ({
    transactions: [],
    transactionsLoading: false,
  }),
}));

vi.mock('@/features/money/useExchangeRates', () => ({
  useExchangeRates: () => ({
    convertToDisplay: (n: number) => n,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('TopBar', () => {
  it('renders account menu trigger', () => {
    render(<TopBar />, { wrapper });
    expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument();
  });

  it('menu contains Settings and Sign out when opened', async () => {
    const user = userEvent.setup();
    render(<TopBar />, { wrapper });

    const trigger = screen.getByRole('button', { name: 'Account menu' });
    await user.click(trigger);

    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('clicking Sign out calls logout', async () => {
    const user = userEvent.setup();
    render(<TopBar />, { wrapper });

    const trigger = screen.getByRole('button', { name: 'Account menu' });
    await user.click(trigger);

    const signOut = screen.getByRole('menuitem', { name: /sign out/i });
    await user.click(signOut);

    expect(mockLogout).toHaveBeenCalled();
  });
});
