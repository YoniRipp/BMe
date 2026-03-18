import { type LucideIcon, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateCardProps {
  onClick: () => void;
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyStateCard({ onClick, icon: Icon = Plus, title, description }: EmptyStateCardProps) {
  return (
    <Card
      className="p-8 bg-sage-50/50 border border-sage-100 cursor-pointer hover:bg-sage-50 transition-colors text-center"
      onClick={onClick}
    >
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sage-100 flex items-center justify-center">
        <Icon className="w-7 h-7 text-sage" />
      </div>
      <p className="text-[15px] font-semibold mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Button size="sm" className="mt-4" variant="default">
        <Plus className="w-4 h-4 mr-1" />
        Get started
      </Button>
    </Card>
  );
}
