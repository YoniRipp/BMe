import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Body } from './Body';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { AppProvider } from '@/context/AppContext';

// Mock WeeklyWorkoutGrid
vi.mock('@/components/body/WeeklyWorkoutGrid', () => ({
  WeeklyWorkoutGrid: () => <div data-testid="workout-grid">Grid</div>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      <WorkoutProvider>
        {children}
      </WorkoutProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Body Page', () => {
  it('renders body page', () => {
    render(<Body />, { wrapper });
    expect(screen.getByText(/body/i)).toBeInTheDocument();
  });

  it('shows workouts section', () => {
    render(<Body />, { wrapper });
    expect(screen.getByText(/workouts/i)).toBeInTheDocument();
  });
});
