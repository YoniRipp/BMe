import React, { createContext, useCallback } from 'react';
import { Group } from '@/types/group';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface GroupContextType {
  groups: Group[];
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, group: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  getGroupById: (id: string) => Group | undefined;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useLocalStorage<Group[]>(STORAGE_KEYS.GROUPS, []);

  const addGroup = useCallback((group: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...group,
      id: generateId(),
      createdAt: new Date(),
    };
    setGroups(prev => [...prev, newGroup]);
  }, [setGroups]);

  const updateGroup = useCallback((id: string, updates: Partial<Group>) => {
    setGroups(prev =>
      prev.map(g => g.id === id ? { ...g, ...updates } : g)
    );
  }, [setGroups]);

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, [setGroups]);

  const getGroupById = useCallback((id: string) => {
    return groups.find(g => g.id === id);
  }, [groups]);

  return (
    <GroupContext.Provider value={{
      groups,
      addGroup,
      updateGroup,
      deleteGroup,
      getGroupById
    }}>
      {children}
    </GroupContext.Provider>
  );
}
