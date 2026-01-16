import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EnergyProvider, useEnergy } from './EnergyContext';
import { DailyCheckIn, FoodEntry } from '@/types/energy';
import { storage, STORAGE_KEYS } from '@/lib/storage';

vi.mock('@/lib/storage');
vi.mock('@/lib/utils', () => ({
  generateId: () => 'test-id-123',
}));

const mockCheckIns: DailyCheckIn[] = [
  {
    id: '1',
    date: new Date(2025, 0, 16),
    sleepHours: 7.5,
  },
];

const mockFoodEntries: FoodEntry[] = [
  {
    id: '1',
    date: new Date(2025, 0, 16),
    name: 'Chicken Breast',
    calories: 200,
    protein: 30,
    carbs: 0,
    fats: 5,
  },
];

describe('EnergyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.get as any).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.ENERGY) return mockCheckIns;
      if (key === STORAGE_KEYS.FOOD_ENTRIES) return mockFoodEntries;
      return null;
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EnergyProvider>{children}</EnergyProvider>
  );

  it('provides checkIns and foodEntries', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    expect(result.current.checkIns).toEqual(mockCheckIns);
    expect(result.current.foodEntries).toEqual(mockFoodEntries);
  });

  it('adds new checkIn', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    
    act(() => {
      result.current.addCheckIn({
        date: new Date(2025, 0, 17),
        sleepHours: 8,
      });
    });

    expect(result.current.checkIns).toHaveLength(2);
  });

  it('adds new foodEntry', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    
    act(() => {
      result.current.addFoodEntry({
        date: new Date(2025, 0, 17),
        name: 'Salad',
        calories: 100,
        protein: 5,
        carbs: 10,
        fats: 2,
      });
    });

    expect(result.current.foodEntries).toHaveLength(2);
  });

  it('updates checkIn', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    
    act(() => {
      result.current.updateCheckIn('1', { sleepHours: 8 });
    });

    const updated = result.current.checkIns.find(c => c.id === '1');
    expect(updated?.sleepHours).toBe(8);
  });

  it('deletes foodEntry', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    
    act(() => {
      result.current.deleteFoodEntry('1');
    });

    expect(result.current.foodEntries).toHaveLength(0);
  });
});
