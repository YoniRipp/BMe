import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';
import { storage } from '@/lib/storage';

// Mock storage
vi.mock('@/lib/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    (storage.get as any).mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value when it exists', () => {
    (storage.get as any).mockReturnValue('stored');
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    expect(result.current[0]).toBe('stored');
  });

  it('updates localStorage when value changes', () => {
    (storage.get as any).mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('new value');
    });

    expect(storage.set).toHaveBeenCalledWith('test', 'new value');
    expect(result.current[0]).toBe('new value');
  });

  it('handles function updater', () => {
    (storage.get as any).mockReturnValue(5);
    const { result } = renderHook(() => useLocalStorage('test', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(storage.set).toHaveBeenCalledWith('test', 6);
    expect(result.current[0]).toBe(6);
  });

  it('handles errors gracefully', () => {
    (storage.get as any).mockReturnValue(null);
    (storage.set as any).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('new value');
    });

    // Should not throw, but value might not update
    expect(result.current[0]).toBe('initial');
  });
});
