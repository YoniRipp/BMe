import { Watch, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SettingsSection } from './SettingsSection';
import { useHealthSync } from '@/hooks/useHealthSync';
import { toast } from 'sonner';

const DATA_TYPES = [
  { key: 'workouts', label: 'Workouts', description: 'Sync exercise sessions from your watch' },
  { key: 'sleep', label: 'Sleep', description: 'Sync sleep tracking data' },
  { key: 'nutrition', label: 'Nutrition', description: 'Sync food and calorie data' },
  { key: 'metrics', label: 'Steps & Heart Rate', description: 'Sync daily steps, calories burned, and heart rate' },
];

function platformLabel(platform: string | null): string {
  if (platform === 'apple_health') return 'Apple Health';
  if (platform === 'health_connect') return 'Health Connect';
  return 'Health Platform';
}

export function HealthSyncSection() {
  const {
    platform,
    isNative,
    syncing,
    syncState,
    lastResult,
    syncNow,
    toggleDataType,
  } = useHealthSync();

  if (!isNative) {
    return (
      <SettingsSection icon={Watch} title="Health Sync" iconColor="text-green-600">
        <p className="text-sm text-muted-foreground">
          Health sync is available when using the BeMe mobile app on iOS (Apple Health) or Android (Health Connect).
          Install the mobile app to sync data from your smartwatch or phone.
        </p>
      </SettingsSection>
    );
  }

  const handleSync = async () => {
    try {
      await syncNow();
      if (lastResult) {
        const total = lastResult.workoutsCreated + lastResult.sleepSynced + lastResult.nutritionSynced + lastResult.metricsSynced;
        toast.success(total > 0 ? `Synced ${total} records from ${platformLabel(platform)}` : 'Already up to date');
      }
    } catch {
      toast.error('Sync failed. Please try again.');
    }
  };

  const isEnabled = (dataType: string) =>
    syncState.find((s) => s.dataType === dataType)?.enabled ?? true;

  const lastSyncTime = (dataType: string) => {
    const state = syncState.find((s) => s.dataType === dataType);
    if (!state?.lastSyncedAt) return null;
    return new Date(state.lastSyncedAt).toLocaleString();
  };

  return (
    <SettingsSection icon={Watch} title="Health Sync" iconColor="text-green-600">
      <div className="space-y-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            Connected to <strong>{platformLabel(platform)}</strong>
          </p>
        </div>

        {DATA_TYPES.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <Label>{label}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              {lastSyncTime(key) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last synced: {lastSyncTime(key)}
                </p>
              )}
            </div>
            <input
              type="checkbox"
              checked={isEnabled(key)}
              onChange={(e) => toggleDataType(key, e.target.checked)}
              className="rounded"
            />
          </div>
        ))}

        <div className="pt-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="gap-2">
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
