import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnergyProvider } from './EnergyContext';
import { useEnergy } from '@/hooks/useEnergy';
import { DailyCheckIn, FoodEntry } from '@/types/energy';
import { dailyCheckInsApi } from '@/features/energy/api';

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

vi.mock('@/features/energy/api', () => ({
  foodEntriesApi: {
    list: vi.fn().mockResolvedValue([{ id: '1', date: '2025-01-16', name: 'Chicken Breast', calories: 200, protein: 30, carbs: 0, fats: 5 }]),
    add: vi.fn().mockImplementation((e: { name: string; calories: number; protein: number; carbs: number; fats: number }) =>
      Promise.resolve({ id: 'new-id', date: new Date().toISOString().slice(0, 10), ...e })
    ),
    update: vi.fn().mockResolvedValue({ id: '1', date: '2025-01-16', name: 'Chicken Breast', calories: 200, protein: 30, carbs: 0, fats: 5 }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  dailyCheckInsApi: {
    list: vi.fn().mockResolvedValue([{ id: '1', date: '2025-01-16', sleepHours: 7.5 }]),
    add: vi.fn().mockImplementation((c: { sleepHours?: number }) =>
      Promise.resolve({ id: 'new-id', date: new Date().toISOString().slice(0, 10), sleepHours: c.sleepHours })
    ),
    update: vi.fn().mockImplementation((_id: string, updates: { sleepHours?: number }) =>
      Promise.resolve({ id: '1', date: '2025-01-16', sleepHours: updates.sleepHours ?? 7.5 })
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  searchFoods: vi.fn().mockResolvedValue([]),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

describe('EnergyContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <EnergyProvider>{children}</EnergyProvider>
    </QueryClientProvider>
  );

  it('provides checkIns and foodEntries', async () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    await waitFor(() => {
      expect(result.current.checkIns).toEqual(mockCheckIns);
      expect(result.current.foodEntries).toEqual(mockFoodEntries);
    });
  });

  it('adds new checkIn', async () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    await waitFor(() => expect(result.current.checkIns).toHaveLength(1));

    await act(async () => {
      await result.current.addCheckIn({
        date: new Date(2025, 0, 17),
        sleepHours: 8,
      });
    });

    expect(result.current.checkIns).toHaveLength(2);
  });

  it('adds new foodEntry', async () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    await waitFor(() => expect(result.current.foodEntries).toHaveLength(1));

    await act(async () => {
      await result.current.addFoodEntry({
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

  it('updates checkIn', async () => {
    (dailyCheckInsApi.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: '1',
      date: '2025-01-16',
      sleepHours: 8,
    });
    const { result } = renderHook(() => useEnergy(), { wrapper });
    await waitFor(() => expect(result.current.checkIns).toHaveLength(1));

    await act(async () => {
      await result.current.updateCheckIn('1', { sleepHours: 8 });
    });

    await waitFor(() => {
      const updated = result.current.checkIns.find((c: DailyCheckIn) => c.id === '1');
      expect(updated?.sleepHours).toBe(8);
    });
  });

  it('deletes foodEntry', async () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    await waitFor(() => expect(result.current.foodEntries).toHaveLength(1));

    await act(async () => {
      await result.current.deleteFoodEntry('1');
    });

    await waitFor(() => expect(result.current.foodEntries).toHaveLength(0));
  });
});
