import React, { createContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleItem } from '@/types/schedule';
import { scheduleApi } from '@/features/schedule/api';
import { apiScheduleItemToScheduleItem } from '@/features/schedule/mappers';
import { queryKeys } from '@/lib/queryClient';

interface ScheduleContextType {
  scheduleItems: ScheduleItem[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  refetchSchedule: () => Promise<void>;
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  addScheduleItems: (items: Omit<ScheduleItem, 'id'>[]) => Promise<void>;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;
  getScheduleItemById: (id: string) => ScheduleItem | undefined;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: scheduleItems = [],
    isLoading: scheduleLoading,
    error: scheduleQueryError,
    refetch: refetchScheduleQuery,
  } = useQuery({
    queryKey: queryKeys.schedule,
    queryFn: async () => {
      const list = await scheduleApi.list();
      return list.map(apiScheduleItemToScheduleItem);
    },
  });

  const scheduleError = scheduleQueryError
    ? (scheduleQueryError instanceof Error ? scheduleQueryError.message : 'Failed to load schedule')
    : null;

  const refetchSchedule = useCallback(async () => {
    await refetchScheduleQuery();
  }, [refetchScheduleQuery]);

  const addMutation = useMutation({
    mutationFn: (item: Omit<ScheduleItem, 'id'>) => {
      const today = new Date().toISOString().slice(0, 10);
      return scheduleApi.add({
        title: item.title,
        date: item.date ?? today,
        startTime: item.startTime,
        endTime: item.endTime,
        category: item.category,
        emoji: item.emoji,
        order: item.order,
        isActive: item.isActive,
        groupId: item.groupId,
        recurrence: item.recurrence,
        color: item.color,
      });
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.schedule });
      const previous = queryClient.getQueryData<ScheduleItem[]>(queryKeys.schedule);
      const today = new Date().toISOString().slice(0, 10);
      const optimistic: ScheduleItem = {
        id: `opt-${Date.now()}`,
        date: item.date ?? today,
        title: item.title,
        startTime: item.startTime ?? '09:00',
        endTime: item.endTime ?? '10:00',
        category: item.category ?? 'Other',
        emoji: item.emoji,
        order: item.order ?? (previous?.length ?? 0),
        isActive: item.isActive ?? true,
        groupId: item.groupId,
        recurrence: item.recurrence,
        color: item.color,
      };
      queryClient.setQueryData(queryKeys.schedule, (prev: ScheduleItem[] | undefined) =>
        prev ? [...prev, optimistic] : [optimistic]
      );
      return { previous };
    },
    onError: (_err, _item, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(queryKeys.schedule, context.previous);
      }
    },
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.schedule, (prev: ScheduleItem[] | undefined) => {
        if (!prev) return [apiScheduleItemToScheduleItem(created)];
        const withoutOptimistic = prev.filter((s) => !s.id.startsWith('opt-'));
        return [...withoutOptimistic, apiScheduleItemToScheduleItem(created)];
      });
    },
  });

  const addBatchMutation = useMutation({
    mutationFn: (items: Omit<ScheduleItem, 'id'>[]) => {
      const today = new Date().toISOString().slice(0, 10);
      return scheduleApi.addBatch(
        items.map((it) => ({
          title: it.title,
          date: it.date ?? today,
          startTime: it.startTime,
          endTime: it.endTime,
          category: it.category,
          emoji: it.emoji,
          groupId: it.groupId,
          recurrence: it.recurrence,
          color: it.color,
        }))
      );
    },
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.schedule, (prev: ScheduleItem[] | undefined) =>
        prev ? [...prev, ...created.map(apiScheduleItemToScheduleItem)] : created.map(apiScheduleItemToScheduleItem)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ScheduleItem> }) =>
      scheduleApi.update(id, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.schedule, (prev: ScheduleItem[] | undefined) =>
        prev ? prev.map((s) => (s.id === updated.id ? apiScheduleItemToScheduleItem(updated) : s)) : [apiScheduleItemToScheduleItem(updated)]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKeys.schedule, (prev: ScheduleItem[] | undefined) =>
        prev ? prev.filter((s) => s.id !== id) : []
      );
    },
  });

  const addScheduleItem = useCallback(
    (item: Omit<ScheduleItem, 'id'>): Promise<void> =>
      addMutation.mutateAsync(item).then(() => undefined),
    [addMutation]
  );

  const addScheduleItems = useCallback(
    (items: Omit<ScheduleItem, 'id'>[]): Promise<void> => {
      if (items.length === 0) return Promise.resolve();
      return addBatchMutation.mutateAsync(items).then(() => undefined);
    },
    [addBatchMutation]
  );

  const updateScheduleItem = useCallback(
    (id: string, updates: Partial<ScheduleItem>): Promise<void> =>
      updateMutation.mutateAsync({ id, updates }).then(() => undefined),
    [updateMutation]
  );

  const deleteScheduleItem = useCallback(
    (id: string): Promise<void> => deleteMutation.mutateAsync(id).then(() => undefined),
    [deleteMutation]
  );

  const getScheduleItemById = useCallback(
    (id: string) => scheduleItems.find((s) => s.id === id),
    [scheduleItems]
  );

  return (
    <ScheduleContext.Provider
      value={{
        scheduleItems,
        scheduleLoading,
        scheduleError,
        refetchSchedule,
        addScheduleItem,
        addScheduleItems,
        updateScheduleItem,
        deleteScheduleItem,
        getScheduleItemById,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}
