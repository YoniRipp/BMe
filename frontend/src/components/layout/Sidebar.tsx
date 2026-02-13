import { Home, Calendar, DollarSign, Dumbbell, Zap, Settings, TrendingUp, PanelLeftClose } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
  { path: '/money', icon: DollarSign, label: 'Money' },
  { path: '/body', icon: Dumbbell, label: 'Body' },
  { path: '/energy', icon: Zap, label: 'Energy' },
  { path: '/insights', icon: TrendingUp, label: 'Insights' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const location = useLocation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex flex-col w-64 p-0 gap-0 border-r border-border"
        showCloseButton={false}
        aria-label="Main navigation"
      >
        <div className="p-4 border-b border-border shrink-0 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="BeMe home" onClick={() => onOpenChange(false)}>
            <img src="/logo.png" alt="" className="h-7 w-auto object-contain" />
            <span className="font-semibold text-lg truncate">BeMe</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Hide sidebar"
            className="shrink-0"
          >
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => onOpenChange(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
