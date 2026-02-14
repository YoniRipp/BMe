import { GroupMember } from '@/types/group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, X } from 'lucide-react';

interface MemberListProps {
  members: GroupMember[];
  currentUserId?: string;
  canRemove?: boolean;
  onRemove?: (member: GroupMember) => void;
}

export function MemberList({ members, currentUserId, canRemove, onRemove }: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member, idx) => (
        <div key={member.userId ?? idx} className="flex items-center justify-between p-2 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm">{member.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
              {member.role}
            </Badge>
            {canRemove && onRemove && member.userId !== currentUserId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemove(member)}
                aria-label={`Remove ${member.email}`}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
