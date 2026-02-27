import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import { DEFAULT_SETTINGS } from '../types/settings';

// Mock useLocalStorage
const mockSetSettings = vi.fn();
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [DEFAULT_SETTINGS, mockSetSettings]),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'a@b.com', name: 'Test', role: 'user' as const },
    authLoading: false,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides user data', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.user).toBeDefined();
    expect(result.current.user.name).toBeDefined();
  });

  it('provides default settings', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('updates settings', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    
    act(() => {
      result.current.updateSettings({ currency: 'EUR' });
    });

    expect(mockSetSettings).toHaveBeenCalled();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within AppProvider');
    
    consoleSpy.mockRestore();
  });
});
