import { GroupInvitation } from '@/types/group';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface GroupInvitationsProps {
  invitations: GroupInvitation[];
  onAccept?: (invitation: GroupInvitation) => void;
  onDecline?: (invitation: GroupInvitation) => void;
}

export function GroupInvitations({ invitations, onAccept, onDecline }: GroupInvitationsProps) {
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Pending Invitations</h3>
      {invitations.map((invitation, idx) => (
        <Card key={idx} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Group Invitation</p>
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
