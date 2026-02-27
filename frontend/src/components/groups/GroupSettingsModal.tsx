import { useState, useEffect } from 'react';
import { Group, GroupInvitation, GROUP_TYPES } from '@/types/group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MemberList } from './MemberList';
import { useGroups } from '@/hooks/useGroups';
import { useApp } from '@/context/AppContext';
import { isValidEmail } from '@/lib/validation';

interface GroupSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group;
}

export function GroupSettingsModal({ open, onOpenChange, group }: GroupSettingsModalProps) {
  const { updateGroup, getGroupById, inviteToGroup, cancelInvite, removeMember } = useGroups();
  const { user } = useApp();
  const currentGroup = group && open ? (getGroupById(group.id) ?? group) : group;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('household');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (currentGroup) {
      setName(currentGroup.name);
      setDescription(currentGroup.description ?? '');
      setType(currentGroup.type);
      setInviteEmail('');
      setInviteError('');
    }
  }, [currentGroup, open]);

  if (!currentGroup) return null;

  const isAdmin = currentGroup.members.some((m) => m.userId === user.id && m.role === 'admin');
  const memberEmails = new Set(currentGroup.members.map((m) => m.email.toLowerCase()));
  const invitationEmails = new Set(currentGroup.invitations.map((i) => i.email.toLowerCase()));

  const handleSave = () => {
    updateGroup(currentGroup.id, { name: name.trim(), description: description.trim() || undefined, type });
  };

  const handleInvite = async () => {
    setInviteError('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('Enter an email address');
      return;
    }
    if (!isValidEmail(email)) {
      setInviteError('Enter a valid email address');
      return;
    }
    if (memberEmails.has(email)) {
      setInviteError('This person is already a member');
      return;
    }
    if (invitationEmails.has(email)) {
      setInviteError('Already invited');
      return;
    }
    try {
      await inviteToGroup(currentGroup.id, email);
      setInviteEmail('');
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Failed to invite');
    }
  };

  const handleCancelInvite = (inv: GroupInvitation) => {
    cancelInvite(currentGroup.id, inv.email);
  };

  const handleRemoveMember = (member: { userId: string }) => {
    removeMember(currentGroup.id, member.userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentGroup.name} – Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isAdmin && (
            <>
              <div>
                <Label htmlFor="group-name">Name</Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group name"
                />
              </div>
              <div>
                <Label htmlFor="group-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="group-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === 'other' ? 'Other' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="group-desc">Description (optional)</Label>
                <Textarea
                  id="group-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group for?"
                  rows={2}
                />
              </div>
              <DialogFooter className="sm:justify-start">
                <Button type="button" onClick={handleSave}>
                  Save changes
                </Button>
              </DialogFooter>
            </>
          )}

          <div>
            <Label>Members ({currentGroup.members.length})</Label>
            <div className="mt-2">
              <MemberList
                members={currentGroup.members}
                currentUserId={user.id}
                canRemove={isAdmin}
                onRemove={handleRemoveMember}
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <Label htmlFor="invite-email">Invite by email</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleInvite())}
                />
                <Button type="button" onClick={handleInvite}>
                  Invite
                </Button>
              </div>
              {inviteError && <p className="text-sm text-destructive mt-1">{inviteError}</p>}
            </div>
          )}

          {currentGroup.invitations.length > 0 && (
            <div>
              <Label>Pending invitations ({currentGroup.invitations.length})</Label>
              <div className="mt-2 space-y-2">
                {currentGroup.invitations.map((inv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm"
                  >
                    <span className="text-muted-foreground">{inv.email}</span>
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(inv)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
