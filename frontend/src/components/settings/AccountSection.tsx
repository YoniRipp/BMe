import { useApp } from '@/context/AppContext';
import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsSection } from './SettingsSection';

export function AccountSection() {
  const { user } = useApp();

  return (
    <SettingsSection icon={SettingsIcon} title="Account">
      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
      <p className="text-xs text-muted-foreground">
        You can sign out from the account menu in the top bar.
      </p>
    </SettingsSection>
  );
}
