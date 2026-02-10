import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { ONBOARDING_STEPS, completeOnboarding, isOnboardingCompleted } from '@/lib/onboarding';

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check if onboarding should be shown
    if (isOnboardingCompleted()) {
      return;
    }

    // Show onboarding after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible && currentStep < ONBOARDING_STEPS.length) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [currentStep, isVisible]);

  const POSITION_OFFSETS: Record<
    string,
    (rect: DOMRect, scrollY: number, scrollX: number) => { top: number; left: number }
  > = {
    bottom: (r, sy, sx) => ({
      top: r.bottom + sy + 10,
      left: r.left + sx + r.width / 2,
    }),
    top: (r, sy, sx) => ({
      top: r.top + sy - 10,
      left: r.left + sx + r.width / 2,
    }),
    left: (r, sy, sx) => ({
      top: r.top + sy + r.height / 2,
      left: r.left + sx - 10,
    }),
    right: (r, sy, sx) => ({
      top: r.top + sy + r.height / 2,
      left: r.right + sx + 10,
    }),
  };

  const updatePosition = () => {
    if (currentStep >= ONBOARDING_STEPS.length) return;

    const step = ONBOARDING_STEPS[currentStep];
    const targetElement = document.querySelector(step.target) as HTMLElement;

    if (targetElement) {
      targetRef.current = targetElement;
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const pos = step.position || 'bottom';
      const offset = POSITION_OFFSETS[pos] ?? POSITION_OFFSETS.bottom;
      setPosition(offset(rect, scrollY, scrollX));

      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || currentStep >= ONBOARDING_STEPS.length) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleNext}
      />

      {/* Highlight target element */}
      {targetRef.current && (
        <div
          className="fixed z-[51] pointer-events-none"
          style={{
            top: targetRef.current.getBoundingClientRect().top + window.scrollY,
            left: targetRef.current.getBoundingClientRect().left + window.scrollX,
            width: targetRef.current.offsetWidth,
            height: targetRef.current.offsetHeight,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.8)',
            borderRadius: '8px',
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        className="fixed z-[52] w-80 max-w-[calc(100vw-2rem)]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, 0)',
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSkip}
              aria-label="Skip onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{step.content}</CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
            <Button size="sm" onClick={handleNext}>
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
