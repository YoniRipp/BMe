import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface ContentWithLoadingProps {
  /** When true, shows the loading state instead of children. */
  loading: boolean;
  /** Message shown under the spinner (e.g. "Loading transactions..."). */
  loadingText?: string;
  /** Optional skeleton to show instead of spinner when loading (e.g. list of skeleton cards). */
  skeleton?: ReactNode;
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
 * Use skeleton for list pages to show a skeleton layout (cards/rows) instead of only a spinner.
 */
export function ContentWithLoading({
  loading,
  loadingText = 'Loading...',
  skeleton,
  error,
  children,
  minHeight,
  className,
}: ContentWithLoadingProps) {
  if (loading) {
    if (skeleton) {
      return (
        <div
          className={className}
          style={minHeight ? { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight } : undefined}
        >
          {skeleton}
        </div>
      );
    }
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
