import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { PageHeader } from '@/components/shared/PageHeader';
import { Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { AccountSection } from '@/components/settings/AccountSection';
import { CurrencySection } from '@/components/settings/CurrencySection';
import { DateFormatSection } from '@/components/settings/DateFormatSection';
import { UnitsSection } from '@/components/settings/UnitsSection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { DataManagementSection } from '@/components/settings/DataManagementSection';
import { storage } from '@/lib/storage';

export function Settings() {
  const { updateSettings } = useSettings();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleClearData = () => {
    try {
      storage.clear();
      toast.success('All data cleared');
      window.location.reload();
    } catch {
      toast.error('Failed to clear data');
    }
  };

  const handleResetSettings = () => {
    try {
      updateSettings(DEFAULT_SETTINGS);
      toast.success('Settings reset to defaults');
    } catch {
      toast.error('Failed to reset settings');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences"
        icon={SettingsIcon}
        iconColor="text-gray-600"
      />

      <AccountSection />
      <CurrencySection />
      <DateFormatSection />
      <UnitsSection />
      <AppearanceSection />
      <NotificationsSection />
      <DataManagementSection
        onResetClick={() => setShowResetConfirm(true)}
        onClearClick={() => setShowClearConfirm(true)}
      />

      <ConfirmationDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone. All transactions, workouts, food entries, and other data will be permanently deleted."
        onConfirm={handleClearData}
        confirmLabel="Clear All Data"
        cancelLabel="Cancel"
        variant="destructive"
      />

      <ConfirmationDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to their default values? Your data will not be affected."
        onConfirm={handleResetSettings}
        confirmLabel="Reset Settings"
        cancelLabel="Cancel"
        variant="default"
      />
    </div>
  );
}
