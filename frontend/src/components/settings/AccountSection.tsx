import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import { SettingsSection } from './SettingsSection';

export function AccountSection() {
  const { user } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <SettingsSection icon={SettingsIcon} title="Account">
      <p className="text-[15px] font-medium text-stone mb-4">{user.email}</p>
      <button
        type="button"
        onClick={handleLogOut}
        className="flex items-center gap-2 w-full px-4 py-3 text-[15px] font-semibold text-stone hover:text-charcoal hover:bg-muted/60 rounded-xl transition-colors text-left"
        aria-label="Log out"
      >
        <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.25} />
        Log out
      </button>
    </SettingsSection>
  );
}
