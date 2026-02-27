import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Transaction } from '@/types/transaction';
import { AppProvider } from '@/context/AppContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'a@b.com', name: 'Test', role: 'user' as const },
    authLoading: false,
  }),
}));

vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({ groups: [] }),
}));

vi.mock('@/lib/storage', () => ({
  storage: { get: vi.fn(() => null), set: vi.fn(), remove: vi.fn(), clear: vi.fn() },
  STORAGE_KEYS: { SETTINGS: 'beme_settings' },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

const mockTransaction: Transaction = {
  id: '1',
  date: new Date(2025, 0, 16),
  type: 'expense',
  amount: 50,
  category: 'Food',
  description: 'Lunch',
  isRecurring: false,
};

describe('TransactionModal', () => {
  it('renders add transaction form when no transaction provided', () => {
    const onSave = vi.fn();
    render(
      <TransactionModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
      { wrapper }
    );
    expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument();
  });

  it('renders edit transaction form when transaction provided', () => {
    const onSave = vi.fn();
    render(
      <TransactionModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        transaction={mockTransaction}
      />,
      { wrapper }
    );
    expect(screen.getByRole('heading', { name: 'Edit Transaction' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('validates amount field', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TransactionModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
      { wrapper }
    );

    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '-10');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/amount must be between 0\.01 and 1,000,000/i)).toBeInTheDocument();
    });
  });

  it('calls onSave with form data when submitted', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TransactionModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
      { wrapper }
    );

    await user.type(screen.getByLabelText(/amount/i), '100');
    const categoryTrigger = screen.getByRole('combobox', { name: /category/i });
    await user.click(categoryTrigger);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'Food' }));
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
