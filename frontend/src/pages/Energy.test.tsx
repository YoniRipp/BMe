import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Energy } from './Energy';
import { EnergyProvider } from '@/context/EnergyContext';
import { AppProvider } from '@/context/AppContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      <EnergyProvider>
        {children}
      </EnergyProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Energy Page', () => {
  it('renders energy page', () => {
    render(<Energy />, { wrapper });
    expect(screen.getByText(/energy/i)).toBeInTheDocument();
  });

  it('shows calorie balance section', () => {
    render(<Energy />, { wrapper });
    expect(screen.getByText(/calorie balance/i)).toBeInTheDocument();
  });

  it('opens food modal when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<Energy />, { wrapper });
    
    const addButton = screen.getByText(/add your first food entry/i);
    await user.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/add food entry/i)).toBeInTheDocument();
    });
  });
});
