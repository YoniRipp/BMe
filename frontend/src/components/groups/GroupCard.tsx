import { useNavigate } from 'react-router-dom';
import { Group } from '@/types/group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface GroupCardProps {
  group: Group;
  onSettings?: (group: Group) => void;
}

export function GroupCard({ group, onSettings }: GroupCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{group.name}</h3>
            <Badge variant="secondary">{group.type}</Badge>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>
        {onSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSettings(group);
            }}
            aria-label="Group settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{group.members.length} members</span>
        </div>
        <span>Created {formatDate(group.createdAt)}</span>
      </div>
    </Card>
  );
}
