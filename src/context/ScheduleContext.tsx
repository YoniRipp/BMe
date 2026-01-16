import React, { createContext, useCallback } from 'react';
import { ScheduleItem } from '@/types/schedule';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { SAMPLE_SCHEDULE } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface ScheduleContextType {
  scheduleItems: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  getScheduleItemById: (id: string) => ScheduleItem | undefined;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const initializeSchedule = () => {
    const existing = storage.get<ScheduleItem[]>(STORAGE_KEYS.SCHEDULE);
    return existing || SAMPLE_SCHEDULE;
  };

  const [scheduleItems, setScheduleItems] = useLocalStorage<ScheduleItem[]>(
    STORAGE_KEYS.SCHEDULE,
    initializeSchedule()
  );

  const addScheduleItem = useCallback((item: Omit<ScheduleItem, 'id'>) => {
    const newItem: ScheduleItem = {
      ...item,
      id: generateId(),
    };
    setScheduleItems(prev => [...prev, newItem]);
  }, [setScheduleItems]);

  const updateScheduleItem = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    setScheduleItems(prev =>
      prev.map(s => s.id === id ? { ...s, ...updates } : s)
    );
  }, [setScheduleItems]);

  const deleteScheduleItem = useCallback((id: string) => {
    setScheduleItems(prev => prev.filter(s => s.id !== id));
  }, [setScheduleItems]);

  const getScheduleItemById = useCallback((id: string) => {
    return scheduleItems.find(s => s.id === id);
  }, [scheduleItems]);

  return (
    <ScheduleContext.Provider value={{
      scheduleItems,
      addScheduleItem,
      updateScheduleItem,
      deleteScheduleItem,
      getScheduleItemById
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}
