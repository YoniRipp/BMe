import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface ContentWithLoadingProps {
  /** When true, shows the loading state instead of children. */
  loading: boolean;
  /** Message shown under the spinner (e.g. "Loading transactions..."). */
  loadingText?: string;
  /** Optional error message shown above children when not loading. */
  error?: string | null;
  /** Content shown when not loading. */
  children: ReactNode;
  /** Optional minimum height during loading to reduce layout shift. */
  minHeight?: string | number;
  className?: string;
}

/**
 * Single place for section/page loading: same spinner and layout everywhere.
 * Use for any section that fetches data (transactions, schedule, goals, workouts, energy, etc.).
 */
export function ContentWithLoading({
  loading,
  loadingText = 'Loading...',
  error,
  children,
  minHeight,
  className,
}: ContentWithLoadingProps) {
  if (loading) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={minHeight ? { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight } : undefined}
      >
        <LoadingSpinner text={loadingText} />
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <p className="text-sm text-destructive mb-2">{error}</p>
      )}
      {children}
    </div>
  );
}
