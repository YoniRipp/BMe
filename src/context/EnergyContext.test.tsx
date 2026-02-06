import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EnergyProvider } from './EnergyContext';
import { useEnergy } from '@/hooks/useEnergy';
import { DailyCheckIn, FoodEntry } from '@/types/energy';

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

const apiCheckIn = { id: '1', date: '2025-01-16', sleepHours: 7.5 };
const apiFoodEntry = { id: '1', date: '2025-01-16', name: 'Chicken Breast', calories: 200, protein: 30, carbs: 0, fats: 5 };

vi.mock('@/features/energy/api', () => ({
  foodEntriesApi: {
    list: vi.fn().mockResolvedValue([apiFoodEntry]),
    add: vi.fn().mockImplementation((e: { name: string; calories: number; protein: number; carbs: number; fats: number }) =>
      Promise.resolve({ id: 'new-id', date: new Date().toISOString().slice(0, 10), ...e })
    ),
    update: vi.fn().mockResolvedValue(apiFoodEntry),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  dailyCheckInsApi: {
    list: vi.fn().mockResolvedValue([apiCheckIn]),
    add: vi.fn().mockImplementation((c: { sleepHours?: number }) =>
      Promise.resolve({ id: 'new-id', date: new Date().toISOString().slice(0, 10), sleepHours: c.sleepHours })
    ),
    update: vi.fn().mockResolvedValue(apiCheckIn),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('EnergyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    const updated = result.current.checkIns.find((c: DailyCheckIn) => c.id === '1');
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
