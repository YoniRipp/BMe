import { GroupInvitation } from '@/types/group';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface GroupInvitationsProps {
  /** Simple list of invitations (e.g. in group settings). */
  invitations?: GroupInvitation[];
  /** List with group name for "Invitations for you" (takes precedence if both provided). */
  items?: { groupName: string; invitation: GroupInvitation }[];
  onAccept?: (invitation: GroupInvitation) => void;
  onDecline?: (invitation: GroupInvitation) => void;
  /** When true, do not render the internal "Pending Invitations" heading (e.g. when parent provides its own). */
  hideTitle?: boolean;
}

export function GroupInvitations({ invitations = [], items, onAccept, onDecline, hideTitle }: GroupInvitationsProps) {
  const list = items ?? invitations.map((invitation) => ({ groupName: '', invitation }));
  if (list.length === 0) return null;

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="font-semibold">Pending Invitations</h3>}
      {list.map(({ groupName, invitation }, idx) => (
        <Card key={idx} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {groupName ? `Invitation to join ${groupName}` : 'Group Invitation'}
                </p>
                <p className="text-sm text-muted-foreground">
                  From: {invitation.invitedBy}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {onAccept && (
                <Button size="sm" onClick={() => onAccept(invitation)}>
                  Accept
                </Button>
              )}
              {onDecline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline(invitation)}
                >
                  Decline
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
