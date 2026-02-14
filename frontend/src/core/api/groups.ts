import { request } from './client';
import type { Group, GroupMember } from '@/types/group';

export interface ApiGroup {
  id: string;
  name: string;
  description?: string;
  type: string;
  members: { userId: string; email: string; role: string }[];
  invitations: { email: string; invitedBy: string; invitedAt: string }[];
  createdAt: string;
}

function toGroup(api: ApiGroup): Group {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    type: api.type,
    members: api.members.map((m): GroupMember => ({ userId: m.userId, email: m.email, role: m.role as GroupMember['role'] })),
    invitations: api.invitations.map((inv) => ({
      email: inv.email,
      invitedBy: inv.invitedBy,
      invitedAt: inv.invitedAt ? new Date(inv.invitedAt) : new Date(),
    })),
    createdAt: api.createdAt ? new Date(api.createdAt) : new Date(),
  };
}

export const groupsApi = {
  list: () =>
    request<ApiGroup[]>('/api/groups').then((list) => list.map(toGroup)),

  get: (id: string) =>
    request<ApiGroup>(`/api/groups/${id}`).then(toGroup),

  create: (body: { name: string; description?: string; type: string }) =>
    request<ApiGroup>('/api/groups', { method: 'POST', body }).then(toGroup),

  update: (id: string, body: Partial<{ name: string; description: string; type: string }>) =>
    request<ApiGroup>(`/api/groups/${id}`, { method: 'PATCH', body }).then(toGroup),

  delete: (id: string) =>
    request<void>(`/api/groups/${id}`, { method: 'DELETE' }),

  invite: (id: string, email: string) =>
    request<ApiGroup>(`/api/groups/${id}/invite`, { method: 'POST', body: { email } }).then(toGroup),

  cancelInvite: (id: string, email: string) =>
    request<ApiGroup>(`/api/groups/${id}/invitations`, { method: 'DELETE', body: { email } }).then(toGroup),

  acceptInvite: (id: string) =>
    request<ApiGroup>(`/api/groups/${id}/accept`, { method: 'POST' }).then(toGroup),

  removeMember: (id: string, userId: string) =>
    request<void>(`/api/groups/${id}/members/${userId}`, { method: 'DELETE' }),
};
