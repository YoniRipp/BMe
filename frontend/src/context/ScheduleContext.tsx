import React, { createContext, useCallback, useEffect, useState } from 'react';
import { ScheduleItem } from '@/types/schedule';
import { scheduleApi } from '@/features/schedule/api';

interface ScheduleContextType {
  scheduleItems: ScheduleItem[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  refetchSchedule: () => Promise<void>;
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  addScheduleItems: (items: Omit<ScheduleItem, 'id'>[]) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => Promise<void>;
  deleteScheduleItem: (id: string) => void;
  getScheduleItemById: (id: string) => ScheduleItem | undefined;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

import { apiScheduleItemToScheduleItem } from '@/features/schedule/mappers';

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const refetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const list = await scheduleApi.list();
      setScheduleItems(list.map(apiScheduleItemToScheduleItem));
    } catch (e) {
      setScheduleError(e instanceof Error ? e.message : 'Failed to load schedule');
      setScheduleItems([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchSchedule();
  }, [refetchSchedule]);

  const addScheduleItem = useCallback((item: Omit<ScheduleItem, 'id'>): Promise<void> => {
    setScheduleError(null);
    return scheduleApi.add({
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      category: item.category,
      emoji: item.emoji,
      order: item.order,
      isActive: item.isActive,
      groupId: item.groupId,
      recurrence: item.recurrence,
    }).then(created => {
      setScheduleItems(prev => [...prev, apiScheduleItemToScheduleItem(created)]);
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to add schedule item');
      throw e;
    });
  }, []);

  const addScheduleItems = useCallback((items: Omit<ScheduleItem, 'id'>[]) => {
    if (items.length === 0) return;
    setScheduleError(null);
    scheduleApi.addBatch(items.map(it => ({
      title: it.title,
      startTime: it.startTime,
      endTime: it.endTime,
      category: it.category,
      emoji: it.emoji,
      groupId: it.groupId,
      recurrence: it.recurrence,
    }))).then(created => {
      setScheduleItems(prev => [...prev, ...created.map(apiScheduleItemToScheduleItem)]);
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to add schedule items');
    });
  }, []);

  const updateScheduleItem = useCallback((id: string, updates: Partial<ScheduleItem>): Promise<void> => {
    setScheduleError(null);
    return scheduleApi.update(id, updates).then(updated => {
      setScheduleItems(prev =>
        prev.map(s => s.id === id ? apiScheduleItemToScheduleItem(updated) : s)
      );
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to update schedule item');
      throw e;
    });
  }, []);

  const deleteScheduleItem = useCallback((id: string) => {
    setScheduleError(null);
    scheduleApi.delete(id).then(() => {
      setScheduleItems(prev => prev.filter(s => s.id !== id));
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to delete schedule item');
    });
  }, []);

  const getScheduleItemById = useCallback((id: string) => {
    return scheduleItems.find(s => s.id === id);
  }, [scheduleItems]);

  return (
    <ScheduleContext.Provider value={{
      scheduleItems,
      scheduleLoading,
      scheduleError,
      refetchSchedule,
      addScheduleItem,
      addScheduleItems,
      updateScheduleItem,
      deleteScheduleItem,
      getScheduleItemById
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}
