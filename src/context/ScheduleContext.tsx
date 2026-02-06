import React, { createContext, useCallback, useEffect, useState } from 'react';
import { ScheduleItem } from '@/types/schedule';
import { scheduleApi } from '@/lib/api';

interface ScheduleContextType {
  scheduleItems: ScheduleItem[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  refetchSchedule: () => Promise<void>;
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  addScheduleItems: (items: Omit<ScheduleItem, 'id'>[]) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  getScheduleItemById: (id: string) => ScheduleItem | undefined;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

function apiToItem(a: { id: string; title: string; startTime: string; endTime: string; category: string; emoji?: string; order: number; isActive: boolean; groupId?: string }): ScheduleItem {
  return {
    id: a.id,
    title: a.title,
    startTime: a.startTime,
    endTime: a.endTime,
    category: a.category,
    emoji: a.emoji,
    order: a.order,
    isActive: a.isActive,
    groupId: a.groupId,
  };
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const refetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const list = await scheduleApi.list();
      setScheduleItems(list.map(apiToItem));
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

  const addScheduleItem = useCallback((item: Omit<ScheduleItem, 'id'>) => {
    setScheduleError(null);
    scheduleApi.add({
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      category: item.category,
      emoji: item.emoji,
      order: item.order,
      isActive: item.isActive,
      groupId: item.groupId,
    }).then(created => {
      setScheduleItems(prev => [...prev, apiToItem(created)]);
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to add schedule item');
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
    }))).then(created => {
      setScheduleItems(prev => [...prev, ...created.map(apiToItem)]);
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to add schedule items');
    });
  }, []);

  const updateScheduleItem = useCallback((id: string, updates: Partial<ScheduleItem>) => {
    setScheduleError(null);
    scheduleApi.update(id, updates).then(updated => {
      setScheduleItems(prev =>
        prev.map(s => s.id === id ? apiToItem(updated) : s)
      );
    }).catch(e => {
      setScheduleError(e instanceof Error ? e.message : 'Failed to update schedule item');
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
