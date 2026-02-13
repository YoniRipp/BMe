import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}

export function SettingsSection({
  icon: Icon,
  title,
  iconColor = 'text-muted-foreground',
  children,
}: SettingsSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={cn('w-5 h-5', iconColor)} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </Card>
  );
}
