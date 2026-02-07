import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input with placeholder', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} placeholder="Search items..." />);
    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();
  });

  it('calls onChange with debounced value', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test');
    
    expect(onChange).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('test');
    });
  });

  it('shows clear button when value is not empty', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);
    expect(screen.getByLabelText(/clear search/i)).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
  });

  it('clears value when clear button is clicked', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);
    
    const clearButton = screen.getByLabelText(/clear search/i);
    await userEvent.click(clearButton);
    
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('updates local value when prop value changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="old" onChange={onChange} />);
    
    rerender(<SearchBar value="new" onChange={onChange} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('new');
  });
});
