import { Pencil } from 'lucide-react';

interface MacroData {
  current: number;
  goal: number;
}

interface MacroCirclesProps {
  carbs: MacroData;
  fat: MacroData;
  protein: MacroData;
  onEditGoals?: () => void;
}

const R = 38;
const CIRCUMFERENCE = 2 * Math.PI * R;

function MacroRing({
  label,
  current,
  goal,
  color,
  gradientId,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
  gradientId: string;
}) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{label}</p>
      <div className="relative w-[112px] h-[112px]">
        <svg className="w-[112px] h-[112px] -rotate-90" viewBox="0 0 96 96">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="48" cy="48" r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-mist"
          />
          <circle
            cx="48" cy="48" r={R}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 3px ${color}30)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none tabular-nums animate-count-up">{Math.round(current)}</span>
          <span className="text-xs text-muted-foreground leading-none mt-1">/{goal}g</span>
        </div>
      </div>
    </div>
  );
}

export function MacroCircles({ carbs, fat, protein, onEditGoals }: MacroCirclesProps) {
  return (
    <div>
      {onEditGoals && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onEditGoals}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Edit macro goals"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-start justify-center gap-4">
        <MacroRing
          label="Carbs"
          current={carbs.current}
          goal={carbs.goal}
          color="hsl(42, 55%, 55%)"
          gradientId="carbsGradient"
        />
        <MacroRing
          label="Fat"
          current={fat.current}
          goal={fat.goal}
          color="hsl(14, 55%, 58%)"
          gradientId="fatGradient"
        />
        <MacroRing
          label="Protein"
          current={protein.current}
          goal={protein.goal}
          color="hsl(210, 70%, 55%)"
          gradientId="proteinGradient"
        />
      </div>
    </div>
  );
}
