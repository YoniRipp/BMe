import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  variant?: 'spinner' | 'skeleton' | 'overlay';
  text?: string;
}

export function LoadingSpinner({ 
  className, 
  size = 24, 
  variant = 'spinner',
  text 
}: LoadingSpinnerProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={cn("fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-primary" size={size} />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 
          className={cn("animate-spin text-muted-foreground", className)} 
          size={size}
        />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}
