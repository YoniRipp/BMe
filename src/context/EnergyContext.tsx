import React, { createContext, useCallback, useEffect, useState } from 'react';
import { DailyCheckIn, FoodEntry } from '@/types/energy';
import { foodEntriesApi, dailyCheckInsApi } from '@/lib/api';

interface EnergyContextType {
  checkIns: DailyCheckIn[];
  foodEntries: FoodEntry[];
  energyLoading: boolean;
  energyError: string | null;
  refetchEnergy: () => Promise<void>;
  addCheckIn: (checkIn: Omit<DailyCheckIn, 'id'>) => void;
  updateCheckIn: (id: string, checkIn: Partial<DailyCheckIn>) => void;
  deleteCheckIn: (id: string) => void;
  getCheckInById: (id: string) => DailyCheckIn | undefined;
  getCheckInByDate: (date: Date) => DailyCheckIn | undefined;
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => void;
  updateFoodEntry: (id: string, entry: Partial<FoodEntry>) => void;
  deleteFoodEntry: (id: string) => void;
  getFoodEntryById: (id: string) => FoodEntry | undefined;
}

export const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

function apiToCheckIn(a: { id: string; date: string; sleepHours?: number }): DailyCheckIn {
  return {
    id: a.id,
    date: new Date(a.date),
    sleepHours: a.sleepHours != null ? a.sleepHours : undefined,
  };
}

function apiToFoodEntry(a: { id: string; date: string; name: string; calories: number; protein: number; carbs: number; fats: number }): FoodEntry {
  return {
    id: a.id,
    date: new Date(a.date),
    name: a.name,
    calories: a.calories,
    protein: a.protein,
    carbs: a.carbs,
    fats: a.fats,
  };
}

export function EnergyProvider({ children }: { children: React.ReactNode }) {
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [energyError, setEnergyError] = useState<string | null>(null);

  const refetchEnergy = useCallback(async () => {
    setEnergyLoading(true);
    setEnergyError(null);
    try {
      const [checkInsList, foodList] = await Promise.all([
        dailyCheckInsApi.list(),
        foodEntriesApi.list(),
      ]);
      setCheckIns(checkInsList.map(apiToCheckIn));
      setFoodEntries(foodList.map(apiToFoodEntry));
    } catch (e) {
      setEnergyError(e instanceof Error ? e.message : 'Failed to load energy data');
      setCheckIns([]);
      setFoodEntries([]);
    } finally {
      setEnergyLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchEnergy();
  }, [refetchEnergy]);

  const addCheckIn = useCallback((checkIn: Omit<DailyCheckIn, 'id'>) => {
    setEnergyError(null);
    dailyCheckInsApi.add({
      date: checkIn.date.toISOString().slice(0, 10),
      sleepHours: checkIn.sleepHours,
    }).then(created => {
      setCheckIns(prev => [...prev, apiToCheckIn(created)]);
    }).catch(e => {
      setEnergyError(e instanceof Error ? e.message : 'Failed to add check-in');
    });
  }, []);

  const updateCheckIn = useCallback((id: string, updates: Partial<DailyCheckIn>) => {
    setEnergyError(null);
    const body: Record<string, unknown> = {};
    if (updates.date !== undefined) body.date = updates.date.toISOString().slice(0, 10);
    if (updates.sleepHours !== undefined) body.sleepHours = updates.sleepHours;
    dailyCheckInsApi.update(id, body).then(updated => {
      setCheckIns(prev => prev.map(c => c.id === id ? apiToCheckIn(updated) : c));
    }).catch(e => {
      setEnergyError(e instanceof Error ? e.message : 'Failed to update check-in');
    });
  }, []);

  const deleteCheckIn = useCallback((id: string) => {
    setEnergyError(null);
    dailyCheckInsApi.delete(id).then(() => {
      setCheckIns(prev => prev.filter(c => c.id !== id));
    }).catch(e => {
      setEnergyError(e instanceof Error ? e.message : 'Failed to delete check-in');
    });
  }, []);

  const getCheckInById = useCallback((id: string) => checkIns.find(c => c.id === id), [checkIns]);
  const getCheckInByDate = useCallback((date: Date) =>
    checkIns.find(c => c.date.toDateString() === date.toDateString()),
  [checkIns]);

  const addFoodEntry = useCallback((entry: Omit<FoodEntry, 'id'>) => {
    setEnergyError(null);
    foodEntriesApi.add({
      date: entry.date.toISOString().slice(0, 10),
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fats,
    }).then(created => {
      setFoodEntries(prev => [...prev, apiToFoodEntry(created)]);
    }).catch(e => {
      setEnergyError(e instanceof Error ? e.message : 'Failed to add food entry');
    });
  }, []);

  const updateFoodEntry = useCallback((id: string, updates: Partial<FoodEntry>) => {
    setEnergyError(null);
    const body: Record<string, unknown> = {};
    if (updates.date !== undefined) body.date = updates.date.toISOString().slice(0, 10);
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.calories !== undefined) body.calories = updates.calories;
    if (updates.protein !== undefined) body.protein = updates.protein;
    if (updates.carbs !== undefined) body.carbs = updates.carbs;
    if (updates.fats !== undefined) body.fats = updates.fats;
    foodEntriesApi.update(id, body).then(updated => {
      setFoodEntries(prev => prev.map(e => e.id === id ? apiToFoodEntry(updated) : e));
    }).catch(e => {
      setEnergyError(e instanceof Error ? e.message : 'Failed to update food entry');
    });
  }, []);

  const deleteFoodEntry = useCallback((id: string) => {
    setEnergyError(null);
    foodEntriesApi.delete(id).then(() => {
      setFoodEntries(prev => prev.filter(e => e.id !== id));
    }).catch(e => {
      setEnergyError(e instanceof Error ? e.message : 'Failed to delete food entry');
    });
  }, []);

  const getFoodEntryById = useCallback((id: string) => foodEntries.find(e => e.id === id), [foodEntries]);

  return (
    <EnergyContext.Provider value={{
      checkIns,
      foodEntries,
      energyLoading,
      energyError,
      refetchEnergy,
      addCheckIn,
      updateCheckIn,
      deleteCheckIn,
      getCheckInById,
      getCheckInByDate,
      addFoodEntry,
      updateFoodEntry,
      deleteFoodEntry,
      getFoodEntryById,
    }}>
      {children}
    </EnergyContext.Provider>
  );
}
