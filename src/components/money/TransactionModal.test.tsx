import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Transaction } from '@/types/transaction';

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
      />
    );
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
  });

  it('renders edit transaction form when transaction provided', () => {
    const onSave = vi.fn();
    render(
      <TransactionModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        transaction={mockTransaction}
      />
    );
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
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
      />
    );

    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '-10');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument();
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
      />
    );

    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByText('Food'));
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
