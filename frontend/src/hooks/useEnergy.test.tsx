import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnergyProvider } from '@/context/EnergyContext';
import { useEnergy } from './useEnergy';

vi.mock('@/features/energy/api', () => ({
  foodEntriesApi: { list: vi.fn().mockResolvedValue([]), add: vi.fn(), update: vi.fn(), delete: vi.fn() },
  dailyCheckInsApi: { list: vi.fn().mockResolvedValue([]), add: vi.fn(), update: vi.fn(), delete: vi.fn() },
  searchFoods: vi.fn().mockResolvedValue([]),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

describe('useEnergy', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <EnergyProvider>{children}</EnergyProvider>
    </QueryClientProvider>
  );

  it('provides energy data from context', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    expect(result.current).toHaveProperty('checkIns');
    expect(result.current).toHaveProperty('foodEntries');
    expect(result.current).toHaveProperty('addCheckIn');
    expect(result.current).toHaveProperty('addFoodEntry');
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useEnergy());
    }).toThrow('useEnergy must be used within EnergyProvider');
  });
});
