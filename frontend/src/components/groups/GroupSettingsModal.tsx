import { Group } from '@/types/group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MemberList } from './MemberList';

interface GroupSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group;
}

export function GroupSettingsModal({ open, onOpenChange, group }: GroupSettingsModalProps) {
  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group.name} - Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Group Type</Label>
            <p className="text-sm text-muted-foreground capitalize">{group.type}</p>
          </div>

          {group.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
          )}

          <div>
            <Label>Members ({group.members.length})</Label>
            <div className="mt-2">
              <MemberList members={group.members} />
            </div>
          </div>

          {group.invitations.length > 0 && (
            <div>
              <Label>Pending Invitations ({group.invitations.length})</Label>
              <div className="mt-2 space-y-1">
                {group.invitations.map((inv, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground p-2 bg-muted rounded">
                    {inv.email}
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
