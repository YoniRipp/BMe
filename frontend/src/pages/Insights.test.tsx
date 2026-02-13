import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Insights } from './Insights';
import { TransactionProvider } from '@/context/TransactionContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { EnergyProvider } from '@/context/EnergyContext';
import { AppProvider } from '@/context/AppContext';

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      <TransactionProvider>
        <WorkoutProvider>
          <EnergyProvider>
            {children}
          </EnergyProvider>
        </WorkoutProvider>
      </TransactionProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Insights Page', () => {
  it('renders insights page with title', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/insights/i)).toBeInTheDocument();
  });

  it('displays financial insights section', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/financial insights/i)).toBeInTheDocument();
  });

  it('displays fitness insights section', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/fitness insights/i)).toBeInTheDocument();
  });

  it('displays health insights section', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/health insights/i)).toBeInTheDocument();
  });

  it('displays spending trend', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/spending trend/i)).toBeInTheDocument();
  });

  it('displays workout frequency', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/workout frequency/i)).toBeInTheDocument();
  });

  it('displays calorie trend', () => {
    render(<Insights />, { wrapper });
    expect(screen.getByText(/calorie trend/i)).toBeInTheDocument();
  });
});
