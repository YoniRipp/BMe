import { GroupMember } from '@/types/group';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface MemberListProps {
  members: GroupMember[];
}

export function MemberList({ members }: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member, idx) => (
        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm">{member.email}</span>
          </div>
          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
            {member.role}
          </Badge>
        </div>
      ))}
    </div>
  );
}
