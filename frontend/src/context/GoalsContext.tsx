import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Goal } from '@/types/goals';
import { goalsApi } from '@/features/goals/api';
import { apiGoalToGoal } from '@/features/goals/mappers';

interface GoalsContextType {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  refetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getGoalById: (id: string) => Goal | undefined;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const refetchGoals = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const list = await goalsApi.list();
      setGoals(list.map(apiGoalToGoal));
    } catch (e) {
      setGoalsError(e instanceof Error ? e.message : 'Failed to load goals');
      setGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchGoals();
  }, [refetchGoals]);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoalsError(null);
    goalsApi
      .add({ type: goal.type, target: goal.target, period: goal.period })
      .then((created) => {
        setGoals((prev) => [...prev, apiGoalToGoal(created)]);
      })
      .catch((e) => {
        setGoalsError(e instanceof Error ? e.message : 'Failed to add goal');
      });
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoalsError(null);
    const body: { type?: string; target?: number; period?: string } = {};
    if (updates.type !== undefined) body.type = updates.type;
    if (updates.target !== undefined) body.target = updates.target;
    if (updates.period !== undefined) body.period = updates.period;
    goalsApi
      .update(id, body)
      .then((updated) => {
        setGoals((prev) =>
          prev.map((g) => (g.id === id ? apiGoalToGoal(updated) : g))
        );
      })
      .catch((e) => {
        setGoalsError(e instanceof Error ? e.message : 'Failed to update goal');
      });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoalsError(null);
    goalsApi
      .delete(id)
      .then(() => {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      })
      .catch((e) => {
        setGoalsError(e instanceof Error ? e.message : 'Failed to delete goal');
      });
  }, []);

  const getGoalById = useCallback(
    (id: string) => {
      return goals.find((g) => g.id === id);
    },
    [goals]
  );

  return (
    <GoalsContext.Provider
      value={{
        goals,
        goalsLoading,
        goalsError,
        refetchGoals,
        addGoal,
        updateGoal,
        deleteGoal,
        getGoalById,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}
