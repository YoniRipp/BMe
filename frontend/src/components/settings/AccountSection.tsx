import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './SettingsSection';
import { AdminUsersSection } from './AdminUsersSection';

export function AccountSection() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <SettingsSection icon={SettingsIcon} title="Account">
      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
        {user.role === 'admin' && <AdminUsersSection />}
      </div>
    </SettingsSection>
  );
}
