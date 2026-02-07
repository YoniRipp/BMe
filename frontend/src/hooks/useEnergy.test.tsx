import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { EnergyProvider } from '@/context/EnergyContext';
import { useEnergy } from './useEnergy';

describe('useEnergy', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EnergyProvider>{children}</EnergyProvider>
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
