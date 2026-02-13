import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCarouselIndex } from '@/hooks/useCarouselIndex';

export interface InsightsSectionSlide {
  title: string;
  content: ReactNode;
}

interface InsightsSectionCarouselProps {
  slides: InsightsSectionSlide[];
  'aria-label'?: string;
}

export function InsightsSectionCarousel({ slides, 'aria-label': ariaLabel }: InsightsSectionCarouselProps) {
  const {
    setIndex,
    clampedIndex,
    setClampedIndex,
    goPrev,
    goNext,
    canGoPrev,
    canGoNext,
    pointerHandlers,
    handleKeyDown,
  } = useCarouselIndex({ slideCount: slides.length });

  if (slides.length === 0) return null;

  return (
    <div
      className="overflow-hidden"
      {...pointerHandlers}
      onPointerLeave={pointerHandlers.onPointerUp}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel ?? 'Insights section carousel'}
      tabIndex={0}
    >
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-border pb-2 mb-4"
        aria-label="Subcategory tabs"
      >
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === clampedIndex}
            aria-controls={`insights-slide-${i}`}
            id={`insights-tab-${i}`}
            tabIndex={i === clampedIndex ? 0 : -1}
            onClick={() => setIndex(i)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              i === clampedIndex
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {slide.title}
          </button>
        ))}
      </div>
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div
            className="flex"
            style={{
              transform: `translateX(-${clampedIndex * 100}%)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            {slides.map((slide, i) => (
              <div
                key={i}
                className="min-w-full shrink-0 min-h-[200px]"
                id={`insights-slide-${i}`}
                role="tabpanel"
                aria-labelledby={`insights-tab-${i}`}
                aria-hidden={i !== clampedIndex}
              >
                {slide.content}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
