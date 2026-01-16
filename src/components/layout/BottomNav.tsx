import { Home, DollarSign, Dumbbell, Zap, Users, Settings, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/money', icon: DollarSign, label: 'Money' },
  { path: '/body', icon: Dumbbell, label: 'Body' },
  { path: '/energy', icon: Zap, label: 'Energy' },
  { path: '/insights', icon: TrendingUp, label: 'Insights' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label, dataAttr }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                data-onboarding={dataAttr}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
