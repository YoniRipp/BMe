import { ArrowUp, ArrowDown } from 'lucide-react';

interface TrendBadgeProps {
  changePercent: number;
  label: string;
}

export function TrendBadge({ changePercent, label }: TrendBadgeProps) {
  const isPositive = changePercent >= 0;
  const value = Math.abs(changePercent).toFixed(1);
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl font-bold">
        {isPositive ? (
          <span className="text-green-600 flex items-center gap-1">
            <ArrowUp className="w-5 h-5" />
            {value}%
          </span>
        ) : (
          <span className="text-red-600 flex items-center gap-1">
            <ArrowDown className="w-5 h-5" />
            {value}%
          </span>
        )}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
