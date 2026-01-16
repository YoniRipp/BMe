import { useApp } from '@/context/AppContext';
import { getGreeting } from '@/lib/utils';

export function TopBar() {
  const { user } = useApp();
  const greeting = getGreeting();

  return (
    <div className="bg-background border-b border-border px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h2 className="text-xl font-bold">{user.name}</h2>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>
    </div>
  );
}
