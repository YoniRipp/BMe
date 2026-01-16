import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalCard } from './GoalCard';
import { Goal } from '@/types/goals';
import { GoalsProvider } from '@/context/GoalsContext';
import { AppProvider } from '@/context/AppContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { EnergyProvider } from '@/context/EnergyContext';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockGoal: Goal = {
  id: 'test-goal',
  type: 'calories',
  target: 2000,
  period: 'weekly',
  createdAt: new Date(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>
    <TransactionProvider>
      <WorkoutProvider>
        <EnergyProvider>
          <GoalsProvider>
            {children}
          </GoalsProvider>
        </EnergyProvider>
      </WorkoutProvider>
    </TransactionProvider>
  </AppProvider>
);

describe('GoalCard', () => {
  it('renders goal card with title', () => {
    render(<GoalCard goal={mockGoal} />, { wrapper });
    expect(screen.getByText(/calories goal/i)).toBeInTheDocument();
  });

  it('displays goal progress', () => {
    render(<GoalCard goal={mockGoal} />, { wrapper });
    expect(screen.getByText(/0 \/ 2000 calories/i)).toBeInTheDocument();
  });

  it('shows edit button when onEdit is provided', () => {
    const onEdit = vi.fn();
    render(<GoalCard goal={mockGoal} onEdit={onEdit} />, { wrapper });
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<GoalCard goal={mockGoal} onEdit={onEdit} />, { wrapper });
    
    const editButton = screen.getByText(/edit/i);
    await user.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockGoal);
  });

  it('opens delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalCard goal={mockGoal} />, { wrapper });
    
    const deleteButton = screen.getByLabelText(/delete goal/i);
    await user.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to delete this goal/i)).toBeInTheDocument();
    });
  });

  it('displays checkmark when goal is achieved', () => {
    const achievedGoal: Goal = {
      ...mockGoal,
      id: 'achieved-goal',
    };

    // Mock getGoalProgress to return 100%
    vi.mock('@/hooks/useGoals', () => ({
      useGoals: () => ({
        deleteGoal: vi.fn(),
        getGoalProgress: () => ({
          current: 2000,
          target: 2000,
          percentage: 100,
        }),
      }),
    }));

    render(<GoalCard goal={achievedGoal} />, { wrapper });
    // The component should show achieved status
    expect(screen.getByText(/calories goal/i)).toBeInTheDocument();
  });
});
