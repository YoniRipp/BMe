/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FoodEntry } from '../../types/energy';
import { FoodEntryModal } from './FoodEntryModal';

const mockEntry: FoodEntry = {
  id: '1',
  date: new Date(2025, 0, 16),
  name: 'Chicken Breast',
  calories: 200,
  protein: 30,
  carbs: 0,
  fats: 5,
};

describe('FoodEntryModal', () => {
  it('renders add food entry form when no entry provided', () => {
    const onSave = vi.fn();
    render(
      <FoodEntryModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />
    );
    expect(screen.getByText('Add Food Entry')).toBeInTheDocument();
  });

  it('renders edit form when entry provided', () => {
    const onSave = vi.fn();
    render(
      <FoodEntryModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        entry={mockEntry}
      />
    );
    expect(screen.getByText('Edit Food Entry')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chicken Breast')).toBeInTheDocument();
  });

  it('validates food name', async () => {
    const user = userEvent.setup();
    render(
      <FoodEntryModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/food name/i);
    await user.clear(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/food name is required/i)).toBeInTheDocument();
    });
  });

  it('calls onSave with form data when submitted', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <FoodEntryModal
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />
    );

    await user.type(screen.getByLabelText(/food name/i), 'Salad');
    await user.type(screen.getByLabelText(/calories/i), '100');
    await user.click(screen.getByRole('button', { name: /add food/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
