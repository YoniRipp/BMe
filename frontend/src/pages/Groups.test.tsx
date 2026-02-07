import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Groups } from './Groups';
import { GroupProvider } from '@/context/GroupContext';
import { AppProvider } from '@/context/AppContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      <GroupProvider>
        {children}
      </GroupProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('Groups Page', () => {
  it('renders groups page with title', () => {
    render(<Groups />, { wrapper });
    expect(screen.getByText(/my groups/i)).toBeInTheDocument();
  });

  it('displays new group button', () => {
    render(<Groups />, { wrapper });
    expect(screen.getByText(/new group/i)).toBeInTheDocument();
  });

  it('opens create group modal when new group button is clicked', async () => {
    const user = userEvent.setup();
    render(<Groups />, { wrapper });
    
    const newGroupButton = screen.getByText(/new group/i);
    await user.click(newGroupButton);
    
    await waitFor(() => {
      expect(screen.getByText(/create group/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no groups exist', () => {
    render(<Groups />, { wrapper });
    expect(screen.getByText(/you don't have any groups yet/i)).toBeInTheDocument();
  });

  it('opens create group modal from empty state', async () => {
    const user = userEvent.setup();
    render(<Groups />, { wrapper });
    
    const createButton = screen.getByText(/create your first group/i);
    await user.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/create group/i)).toBeInTheDocument();
    });
  });
});
