import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatCardColor = 'sage' | 'terracotta' | 'gold' | 'blue';

const COLOR_CLASSES: Record<StatCardColor, { bg: string; text: string; cardBg: string }> = {
  sage: { bg: 'bg-primary/15', text: 'text-primary', cardBg: 'bg-sage-50/50' },
  terracotta: { bg: 'bg-terracotta/15', text: 'text-terracotta', cardBg: 'bg-terracotta/5' },
  gold: { bg: 'bg-gold/15', text: 'text-gold', cardBg: 'bg-gold/5' },
  blue: { bg: 'bg-info/15', text: 'text-info', cardBg: 'bg-info/5' },
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
    <Card className={cn('p-5 border border-border/30 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {value}
            {sublabel != null && <span className="text-base font-normal text-muted-foreground ml-1">{sublabel}</span>}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0', colors.bg, colors.text)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
