import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatCardColor = 'sage' | 'terracotta' | 'gold' | 'blue';

const COLOR_CLASSES: Record<StatCardColor, { bg: string; text: string }> = {
  sage: { bg: 'bg-primary/15', text: 'text-primary' },
  terracotta: { bg: 'bg-terracotta/15', text: 'text-terracotta' },
  gold: { bg: 'bg-gold/15', text: 'text-gold' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-600' },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: StatCardColor;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, sublabel, color = 'sage', className }: StatCardProps) {
  const colors = COLOR_CLASSES[color];
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight">
            {value}
            {sublabel != null && <span className="text-base font-normal text-muted-foreground">{sublabel}</span>}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0', colors.bg, colors.text)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
