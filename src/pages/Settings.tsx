import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, DollarSign, Calendar, Ruler, Palette, Database, Trash2, Download, RefreshCw, Bell } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, DATE_FORMATS, THEMES, DEFAULT_SETTINGS } from '@/types/settings';
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from '@/lib/utils';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { useNotifications } from '@/context/NotificationContext';
import { AdminUsersSection } from '@/components/settings/AdminUsersSection';

export function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { user } = useApp();
  const { logout } = useAuth();
  const { preferences, updatePreferences, permission, requestPermission, testNotification } = useNotifications();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleCurrencyChange = (value: string) => {
    updateSettings({ currency: value as any });
    toast.success('Currency updated');
  };

  const handleDateFormatChange = (value: string) => {
    updateSettings({ dateFormat: value as any });
    toast.success('Date format updated');
  };

  const handleUnitsChange = (value: string) => {
    updateSettings({ units: value as any });
    toast.success('Units updated');
  };

  const handleThemeChange = (value: string) => {
    updateSettings({ theme: value as any });
    toast.success('Theme updated');
    // Apply theme immediately
    applyTheme(value as any);
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleExportData = () => {
    try {
      const allData = {
        transactions: storage.get(STORAGE_KEYS.TRANSACTIONS) || [],
        workouts: storage.get(STORAGE_KEYS.WORKOUTS) || [],
        workoutTemplates: storage.get(STORAGE_KEYS.WORKOUT_TEMPLATES) || [],
        energy: storage.get(STORAGE_KEYS.ENERGY) || [],
        foodEntries: storage.get(STORAGE_KEYS.FOOD_ENTRIES) || [],
        schedule: storage.get(STORAGE_KEYS.SCHEDULE) || [],
        groups: storage.get(STORAGE_KEYS.GROUPS) || [],
        customGroupTypes: storage.get(STORAGE_KEYS.CUSTOM_GROUP_TYPES) || [],
        settings: storage.get(STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS,
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beme-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleClearData = () => {
    try {
      storage.clear();
      toast.success('All data cleared');
      // Reload to reset app state
      window.location.reload();
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  const handleResetSettings = () => {
    try {
      updateSettings(DEFAULT_SETTINGS);
      applyTheme(DEFAULT_SETTINGS.theme);
      toast.success('Settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset settings');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences"
        icon={SettingsIcon}
        iconColor="text-gray-600"
      />

      {/* Account Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Account</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
          {user.role === 'admin' && <AdminUsersSection />}
        </div>
      </Card>

      {/* Currency Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Currency</h3>
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={settings.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Preview: {formatCurrencyUtil(1000, settings.currency)}
          </p>
        </div>
      </Card>

      {/* Date Format Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Date Format</h3>
        </div>
        <div className="space-y-2">
          <Label>Date Format</Label>
          <Select value={settings.dateFormat} onValueChange={handleDateFormatChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Preview: {formatDateUtil(new Date(), settings.dateFormat)}
          </p>
        </div>
      </Card>

      {/* Units Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Ruler className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Units</h3>
        </div>
        <div className="space-y-2">
          <Label>Measurement Units</Label>
          <Select value={settings.units} onValueChange={handleUnitsChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (kg, cm)</SelectItem>
              <SelectItem value="imperial">Imperial (lbs, in)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Used for weight and measurements in workouts
          </p>
        </div>
      </Card>

      {/* Theme Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Theme</h3>
        </div>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={settings.theme} onValueChange={handleThemeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose light, dark, or follow system preference
          </p>
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Notifications</h3>
        </div>
        <div className="space-y-4">
          {permission === 'default' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                Enable browser notifications to receive reminders
              </p>
              <Button onClick={requestPermission} size="sm">
                Enable Notifications
              </Button>
            </div>
          )}
          
          {permission === 'denied' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}

          {permission === 'granted' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive daily reminders for logging food and sleep
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enabled}
                  onChange={(e) => updatePreferences({ enabled: e.target.checked })}
                  className="rounded"
                />
              </div>

              {preferences.enabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Food Logging Reminder</Label>
                      <input
                        type="checkbox"
                        checked={preferences.logFoodReminder}
                        onChange={(e) => updatePreferences({ logFoodReminder: e.target.checked })}
                        className="rounded"
                      />
                    </div>
                    {preferences.logFoodReminder && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={preferences.logFoodReminderTime.hours}
                          onChange={(e) => updatePreferences({
                            logFoodReminderTime: {
                              ...preferences.logFoodReminderTime,
                              hours: parseInt(e.target.value) || 20
                            }
                          })}
                          placeholder="Hour"
                        />
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={preferences.logFoodReminderTime.minutes}
                          onChange={(e) => updatePreferences({
                            logFoodReminderTime: {
                              ...preferences.logFoodReminderTime,
                              minutes: parseInt(e.target.value) || 0
                            }
                          })}
                          placeholder="Minute"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sleep Logging Reminder</Label>
                      <input
                        type="checkbox"
                        checked={preferences.logSleepReminder}
                        onChange={(e) => updatePreferences({ logSleepReminder: e.target.checked })}
                        className="rounded"
                      />
                    </div>
                    {preferences.logSleepReminder && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={preferences.logSleepReminderTime.hours}
                          onChange={(e) => updatePreferences({
                            logSleepReminderTime: {
                              ...preferences.logSleepReminderTime,
                              hours: parseInt(e.target.value) || 22
                            }
                          })}
                          placeholder="Hour"
                        />
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={preferences.logSleepReminderTime.minutes}
                          onChange={(e) => updatePreferences({
                            logSleepReminderTime: {
                              ...preferences.logSleepReminderTime,
                              minutes: parseInt(e.target.value) || 0
                            }
                          })}
                          placeholder="Minute"
                        />
                      </div>
                    )}
                  </div>

                  <Button onClick={testNotification} variant="outline" size="sm">
                    Test Notification
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Data Management Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold">Data Management</h3>
        </div>
        <div className="space-y-3">
          <Button onClick={handleExportData} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
          <Button
            onClick={() => setShowResetConfirm(true)}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Settings to Defaults
          </Button>
          <Button
            onClick={() => setShowClearConfirm(true)}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </Card>

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
