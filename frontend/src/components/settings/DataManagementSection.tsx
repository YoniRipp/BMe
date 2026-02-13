import { Database, Download, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { toast } from 'sonner';
import { SettingsSection } from './SettingsSection';

interface DataManagementSectionProps {
  onResetClick: () => void;
  onClearClick: () => void;
}

export function DataManagementSection({ onResetClick, onClearClick }: DataManagementSectionProps) {
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
      </div>
    </SettingsSection>
  );
}
