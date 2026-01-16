import React, { createContext, useCallback } from 'react';
import { DailyCheckIn, FoodEntry } from '@/types/energy';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { SAMPLE_ENERGY } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface EnergyContextType {
  checkIns: DailyCheckIn[];
  foodEntries: FoodEntry[];
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

export function EnergyProvider({ children }: { children: React.ReactNode }) {
  const initializeCheckIns = () => {
    const existing = storage.get<DailyCheckIn[]>(STORAGE_KEYS.ENERGY);
    return existing || SAMPLE_ENERGY;
  };

  const [checkIns, setCheckIns] = useLocalStorage<DailyCheckIn[]>(
    STORAGE_KEYS.ENERGY,
    initializeCheckIns()
  );

  const initializeFoodEntries = () => {
    const existing = storage.get<FoodEntry[]>(STORAGE_KEYS.FOOD_ENTRIES);
    return existing || [];
  };

  const [foodEntries, setFoodEntries] = useLocalStorage<FoodEntry[]>(
    STORAGE_KEYS.FOOD_ENTRIES,
    initializeFoodEntries()
  );

  const addCheckIn = useCallback((checkIn: Omit<DailyCheckIn, 'id'>) => {
    const newCheckIn: DailyCheckIn = {
      ...checkIn,
      id: generateId(),
    };
    setCheckIns(prev => [...prev, newCheckIn]);
  }, [setCheckIns]);

  const updateCheckIn = useCallback((id: string, updates: Partial<DailyCheckIn>) => {
    setCheckIns(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, [setCheckIns]);

  const deleteCheckIn = useCallback((id: string) => {
    setCheckIns(prev => prev.filter(c => c.id !== id));
  }, [setCheckIns]);

  const getCheckInById = useCallback((id: string) => {
    return checkIns.find(c => c.id === id);
  }, [checkIns]);

  const getCheckInByDate = useCallback((date: Date) => {
    return checkIns.find(c => 
      c.date.toDateString() === date.toDateString()
    );
  }, [checkIns]);

  const addFoodEntry = useCallback((entry: Omit<FoodEntry, 'id'>) => {
    const newEntry: FoodEntry = {
      ...entry,
      id: generateId(),
    };
    setFoodEntries(prev => [...prev, newEntry]);
  }, [setFoodEntries]);

  const updateFoodEntry = useCallback((id: string, updates: Partial<FoodEntry>) => {
    setFoodEntries(prev =>
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }, [setFoodEntries]);

  const deleteFoodEntry = useCallback((id: string) => {
    setFoodEntries(prev => prev.filter(e => e.id !== id));
  }, [setFoodEntries]);

  const getFoodEntryById = useCallback((id: string) => {
    return foodEntries.find(e => e.id === id);
  }, [foodEntries]);

  return (
    <EnergyContext.Provider value={{
      checkIns,
      foodEntries,
      addCheckIn,
      updateCheckIn,
      deleteCheckIn,
      getCheckInById,
      getCheckInByDate,
      addFoodEntry,
      updateFoodEntry,
      deleteFoodEntry,
      getFoodEntryById
    }}>
      {children}
    </EnergyContext.Provider>
  );
}
