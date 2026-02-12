/// <reference types="@testing-library/jest-dom" />
import React, { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Home } from './Home';
import { TransactionProvider } from '../context/TransactionContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { EnergyProvider } from '../context/EnergyContext';
import { ScheduleProvider } from '../context/ScheduleContext';
import { GoalsProvider } from '../context/GoalsContext';
import { AppProvider } from '../context/AppContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      <TransactionProvider>
        <WorkoutProvider>
          <EnergyProvider>
            <ScheduleProvider>
              <GoalsProvider>
                {children}
              </GoalsProvider>
            </ScheduleProvider>
          </EnergyProvider>
        </WorkoutProvider>
      </TransactionProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Home Page', () => {
  it('renders home page with dashboard title', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('displays daily schedule section', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/daily schedule/i)).toBeInTheDocument();
  });

  it('displays dashboard stats section', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/workouts/i)).toBeInTheDocument();
  });

  it('displays financial summary section', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/current balance/i)).toBeInTheDocument();
  });

  it('displays goals section', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/goals/i)).toBeInTheDocument();
  });

  it('opens schedule modal when add schedule button is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />, { wrapper });
    
    const addButton = screen.getByText(/add your first schedule item/i);
    await user.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/schedule item/i)).toBeInTheDocument();
    });
  });

  it('opens goal modal when new goal button is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />, { wrapper });
    
    const newGoalButton = screen.getByText(/new goal/i);
    await user.click(newGoalButton);
    
    await waitFor(() => {
      expect(screen.getByText(/add new goal/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no schedule items exist', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/add your first schedule item/i)).toBeInTheDocument();
  });

  it('shows empty state when no goals exist', () => {
    render(<Home />, { wrapper });
    expect(screen.getByText(/no goals yet/i)).toBeInTheDocument();
  });
});
