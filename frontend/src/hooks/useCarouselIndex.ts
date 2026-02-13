import { useState, useRef, useCallback } from 'react';

const DRAG_THRESHOLD_PX = 50;

export interface UseCarouselIndexOptions {
  slideCount: number;
  initialIndex?: number;
}

export function useCarouselIndex({ slideCount, initialIndex = 0 }: UseCarouselIndexOptions) {
  const [index, setIndex] = useState(initialIndex);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  const clampedIndex = Math.max(0, Math.min(index, slideCount - 1));
  const setClampedIndex = useCallback(
    (next: number) => setIndex((i) => Math.max(0, Math.min(next, slideCount - 1))),
    [slideCount]
  );

  const goPrev = useCallback(() => setClampedIndex(clampedIndex - 1), [clampedIndex, setClampedIndex]);
  const goNext = useCallback(() => setClampedIndex(clampedIndex + 1), [clampedIndex, setClampedIndex]);
  const canGoPrev = clampedIndex > 0;
  const canGoNext = clampedIndex < slideCount - 1;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest?.('button[role="tab"]')) return;
    if (el.closest?.('button[aria-label="Previous"], button[aria-label="Next"]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    dragStartX.current = null;
    dragDeltaX.current = 0;
    if (Math.abs(delta) >= DRAG_THRESHOLD_PX) {
      setIndex((prev) => {
        const next = prev + (delta < 0 ? 1 : -1);
        return Math.max(0, Math.min(next, slideCount - 1));
      });
    }
  }, [slideCount]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setClampedIndex(clampedIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setClampedIndex(clampedIndex + 1);
      }
    },
    [clampedIndex, setClampedIndex]
  );

  return {
    index,
    setIndex,
    clampedIndex,
    setClampedIndex,
    goPrev,
    goNext,
    canGoPrev,
    canGoNext,
    pointerHandlers: { onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerUp: handlePointerUp },
    handleKeyDown,
  };
}
