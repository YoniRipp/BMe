import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionCard } from './TransactionCard';
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

describe('TransactionCard', () => {
  it('renders transaction information', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('calls onEdit when clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<TransactionCard transaction={mockTransaction} onEdit={onEdit} />);
    
    await user.click(screen.getByText('Food'));
    expect(onEdit).toHaveBeenCalledWith(mockTransaction);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TransactionCard transaction={mockTransaction} onDelete={onDelete} />);
    
    const deleteButton = screen.getByRole('button');
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows recurring badge for recurring transactions', () => {
    const recurring = { ...mockTransaction, isRecurring: true };
    render(<TransactionCard transaction={recurring} />);
    expect(screen.getByText('Recurring')).toBeInTheDocument();
  });
});
