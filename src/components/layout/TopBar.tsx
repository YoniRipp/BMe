import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { getGreeting } from '@/lib/utils';

export function TopBar() {
  const { user } = useApp();
  const greeting = getGreeting();

  return (
    <div className="bg-background border-b border-border px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="shrink-0 flex items-center" aria-label="BeMê home">
            <img src="/logo.png" alt="BeMê" className="h-8 w-auto object-contain" />
          </Link>
          <div className="border-l border-border pl-4">
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h2 className="text-xl font-bold">{user.name}</h2>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>
    </div>
  );
}
