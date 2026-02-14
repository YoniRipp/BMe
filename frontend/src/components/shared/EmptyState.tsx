import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Use either action or actionLabel+onAction (base44-style). */
  action?: {
    label: string;
    onClick: () => void;
  };
  actionLabel?: string;
  onAction?: () => void;
  tips?: string[];
}

export function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction, tips }: EmptyStateProps) {
  const resolvedAction = action ?? (actionLabel != null && onAction != null ? { label: actionLabel, onClick: onAction } : undefined);
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
      <div className="p-4 rounded-full bg-muted mb-4 animate-in fade-in duration-300">
        <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {tips && tips.length > 0 && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg max-w-md">
          <p className="text-xs font-semibold mb-2 text-muted-foreground">Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1 text-left">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resolvedAction && (
        <Button onClick={resolvedAction.onClick} className="mt-4" aria-label={resolvedAction.label}>
          {resolvedAction.label}
        </Button>
      )}
    </div>
  );
}
