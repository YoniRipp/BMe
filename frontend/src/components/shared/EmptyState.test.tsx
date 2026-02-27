import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';
import { Users } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState icon={Users} title="No items" />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        icon={Users}
        title="No items"
        description="Create your first item"
      />
    );
    expect(screen.getByText(/create your first item/i)).toBeInTheDocument();
  });

  it('renders action button when provided', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Users}
        title="No items"
        action={{ label: 'Create Item', onClick }}
      />
    );
    
    const button = screen.getByText(/create item/i);
    expect(button).toBeInTheDocument();
    
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders tips when provided', () => {
    const tips = ['Tip 1', 'Tip 2'];
    render(
      <EmptyState
        icon={Users}
        title="No items"
        tips={tips}
      />
    );
    expect(screen.getByText(/tip 1/i)).toBeInTheDocument();
    expect(screen.getByText(/tip 2/i)).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState icon={Users} title="No items" />);
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState icon={Users} title="No items" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
