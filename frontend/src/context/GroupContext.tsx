import React, { createContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Group } from '@/types/group';
import { groupsApi } from '@/core/api/groups';
import { queryKeys } from '@/lib/queryClient';

interface GroupContextType {
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string | null;
  refetchGroups: () => Promise<void>;
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  updateGroup: (id: string, group: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  getGroupById: (id: string) => Group | undefined;
  inviteToGroup: (groupId: string, email: string) => Promise<void>;
  cancelInvite: (groupId: string, email: string) => Promise<void>;
  acceptInvite: (groupId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: groups = [],
    isLoading: groupsLoading,
    error: groupsQueryError,
    refetch: refetchGroupsQuery,
  } = useQuery({
    queryKey: queryKeys.groups,
    staleTime: 2 * 60 * 1000,
    queryFn: () => groupsApi.list(),
  });

  const groupsError = groupsQueryError
    ? (groupsQueryError instanceof Error ? groupsQueryError.message : 'Could not load groups. Please try again.')
    : null;

  const refetchGroups = useCallback(async () => {
    await refetchGroupsQuery();
  }, [refetchGroupsQuery]);

  const addMutation = useMutation({
    mutationFn: (body: { name: string; description?: string; type: string }) => groupsApi.create(body),
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.groups, (prev: Group[] | undefined) =>
        prev ? [...prev, created] : [created]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Group> }) =>
      groupsApi.update(id, {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.type !== undefined && { type: updates.type }),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.groups, (prev: Group[] | undefined) =>
        prev ? prev.map((g) => (g.id === updated.id ? updated : g)) : [updated]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKeys.groups, (prev: Group[] | undefined) =>
        prev ? prev.filter((g) => g.id !== id) : []
      );
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ groupId, email }: { groupId: string; email: string }) =>
      groupsApi.invite(groupId, email),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.groups, (prev: Group[] | undefined) =>
        prev ? prev.map((g) => (g.id === updated.id ? updated : g)) : [updated]
      );
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: ({ groupId, email }: { groupId: string; email: string }) =>
      groupsApi.cancelInvite(groupId, email),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.groups, (prev: Group[] | undefined) =>
        prev ? prev.map((g) => (g.id === updated.id ? updated : g)) : [updated]
      );
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.acceptInvite(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });

  const addGroup = useCallback(
    (group: Omit<Group, 'id' | 'createdAt'>) =>
      addMutation.mutateAsync({
        name: group.name,
        description: group.description,
        type: group.type,
      }).then(() => undefined),
    [addMutation]
  );

  const updateGroup = useCallback(
    (id: string, updates: Partial<Group>) =>
      updateMutation.mutateAsync({ id, updates }).then(() => undefined),
    [updateMutation]
  );

  const deleteGroup = useCallback(
    (id: string) => deleteMutation.mutateAsync(id).then(() => undefined),
    [deleteMutation]
  );

  const getGroupById = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups]
  );

  const inviteToGroup = useCallback(
    (groupId: string, email: string) =>
      inviteMutation.mutateAsync({ groupId, email }).then(() => undefined),
    [inviteMutation]
  );

  const cancelInvite = useCallback(
    (groupId: string, email: string) =>
      cancelInviteMutation.mutateAsync({ groupId, email }).then(() => undefined),
    [cancelInviteMutation]
  );

  const acceptInvite = useCallback(
    (groupId: string) =>
      acceptInviteMutation.mutateAsync(groupId).then(() => undefined),
    [acceptInviteMutation]
  );

  const removeMember = useCallback(
    (groupId: string, userId: string) =>
      removeMemberMutation.mutateAsync({ groupId, userId }).then(() => undefined),
    [removeMemberMutation]
  );

  return (
    <GroupContext.Provider
      value={{
        groups,
        groupsLoading,
        groupsError,
        refetchGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        getGroupById,
        inviteToGroup,
        cancelInvite,
        acceptInvite,
        removeMember,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}
