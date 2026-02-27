import { cn } from '@/lib/utils';

export type JarvisState = 'connecting' | 'listening' | 'speaking' | 'idle';

interface JarvisLiveVisualProps {
  state: JarvisState;
  className?: string;
}

/**
 * Center-stage Jarvis-style orb/ring for Live voice mode.
 * Animations: connecting = breathing glow; listening = gentle pulse; speaking = stronger pulse.
 */
export function JarvisLiveVisual({ state, className }: JarvisLiveVisualProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[200px] w-full transition-all duration-500',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <div
          className={cn(
            'absolute rounded-full border-2 border-primary/40 transition-all duration-300',
            state === 'connecting' && 'w-24 h-24 animate-pulse opacity-80',
            state === 'listening' && 'w-28 h-28 animate-[pulse_2s_ease-in-out_infinite] opacity-70',
            state === 'speaking' && 'w-32 h-32 animate-[pulse_0.8s_ease-in-out_infinite] opacity-90 border-primary/70',
            state === 'idle' && 'w-20 h-20 opacity-50'
          )}
          style={{
            boxShadow:
              state === 'speaking'
                ? '0 0 30px rgba(var(--primary), 0.4), 0 0 60px rgba(var(--primary), 0.2)'
                : state === 'listening'
                  ? '0 0 20px rgba(var(--primary), 0.3)'
                  : '0 0 15px rgba(var(--primary), 0.2)',
          }}
        />
        {/* Inner orb */}
        <div
          className={cn(
            'relative rounded-full bg-primary/30 backdrop-blur-sm transition-all duration-300',
            state === 'connecting' && 'w-16 h-16 animate-pulse',
            state === 'listening' && 'w-20 h-20 animate-[pulse_2.5s_ease-in-out_infinite]',
            state === 'speaking' && 'w-24 h-24 animate-[pulse_1s_ease-in-out_infinite] bg-primary/50',
            state === 'idle' && 'w-14 h-14'
          )}
          style={{
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1), 0 0 25px rgba(var(--primary), 0.25)',
          }}
        />
      </div>
      <p className="mt-4 text-sm text-muted-foreground capitalize">
        {state === 'connecting' && 'Connecting...'}
        {state === 'listening' && 'Listening...'}
        {state === 'speaking' && 'Speaking...'}
        {state === 'idle' && 'Ready'}
      </p>
    </div>
  );
}
