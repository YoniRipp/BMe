export type GroupType = 'household' | 'event' | 'project' | 'other' | string;
export type MemberRole = 'admin' | 'member';

export interface GroupMember {
  userId: string;
  email: string;
  role: MemberRole;
}

export interface GroupInvitation {
  email: string;
  invitedBy: string;
  invitedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: GroupType;
  members: GroupMember[];
  invitations: GroupInvitation[];
  createdAt: Date;
}

export const GROUP_TYPES: GroupType[] = ['household', 'event', 'project', 'other'];
