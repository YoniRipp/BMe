import { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, Trash2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { adminApi, type AppLogEntry } from '@/core/api/admin';
import { SettingsSection } from './SettingsSection';
import { cn } from '@/lib/utils';

interface DataManagementSectionProps {
  onResetClick: () => void;
  onClearClick: () => void;
}

export function DataManagementSection({ onResetClick, onClearClick }: DataManagementSectionProps) {
  const { user } = useApp();
  const [logTab, setLogTab] = useState<'action' | 'error'>('action');
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    setLogsLoading(true);
    adminApi
      .getLogs(logTab)
      .then(setLogs)
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLogsLoading(false));
  }, [user?.role, logTab]);

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
    } catch {
      toast.error('Failed to export data');
    }
  };

  return (
    <SettingsSection icon={Database} title="Data Management" iconColor="text-red-600">
      <div className="space-y-3">
        <Button onClick={handleExportData} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Export All Data
        </Button>
        <Button onClick={onResetClick} variant="outline" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Settings to Defaults
        </Button>
        <Button onClick={onClearClick} variant="destructive" className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Data
        </Button>

        {user?.role === 'admin' && (
          <div className="space-y-3 pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground">Logs</p>
            <div className="flex gap-2">
              <Button
                variant={logTab === 'action' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLogTab('action')}
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Logs
              </Button>
              <Button
                variant={logTab === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLogTab('error')}
              >
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Log errors
              </Button>
            </div>
            <Card className="p-3 max-h-64 overflow-y-auto">
              {logsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {logs.map((entry) => (
                    <li
                      key={entry.id}
                      className={cn(
                        'rounded border p-2',
                        entry.level === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'
                      )}
                    >
                      <span className="text-muted-foreground text-xs">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                      <p className="font-medium mt-0.5">{entry.message}</p>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
