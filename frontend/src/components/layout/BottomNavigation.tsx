import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface BottomNavigationProps {
  items: NavItem[];
  currentPath: string;
  onCenterPress?: () => void;
}

export function BottomNavigation({ items, currentPath, onCenterPress }: BottomNavigationProps) {
  const half = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, half);
  const rightItems = items.slice(half);

  const onboardingKey = (path: string) => {
    if (path === '/body') return 'nav-body';
    if (path === '/energy') return 'nav-energy';
    if (path === '/insights') return 'nav-insights';
    return undefined;
  };

  const renderItem = (item: NavItem) => {
    const isActive = currentPath === item.path;
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        data-onboarding={onboardingKey(item.path)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors press min-h-[48px]
          ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.06em] leading-none ${isActive ? 'text-primary' : ''}`}>
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

      <div
        className="relative mx-3.5 mb-3.5 h-16 bg-card border border-border rounded-[22px]
                   flex items-center justify-around shadow-card-lg pointer-events-auto"
      >
        {leftItems.map(renderItem)}

        <div className="w-16 shrink-0" />

        {rightItems.map(renderItem)}

        <button
          type="button"
          onClick={onCenterPress}
          className="absolute left-1/2 -translate-x-1/2 -top-[22px]
                     w-[60px] h-[60px] rounded-full bg-primary
                     flex items-center justify-center
                     glow-fab ring-[3px] ring-background press
                     active:scale-95 transition-transform"
          aria-label="Voice log"
        >
          <Mic className="w-6 h-6 text-primary-foreground" strokeWidth={2.2} />
        </button>
      </div>
    </nav>
  );
}
