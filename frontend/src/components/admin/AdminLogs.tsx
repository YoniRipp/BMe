import { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
// #region agent log
// #endregion
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { adminApi, type AppLogEntry } from '@/core/api/admin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AdminLogs() {
  const [logTab, setLogTab] = useState<'action' | 'error'>('action');
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'AdminLogs.tsx:AdminLogs', message: 'AdminLogs render', data: {}, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => {});
  // #endregion
  useEffect(() => {
    setLogsLoading(true);
    adminApi
      .getLogs(logTab)
      .then(setLogs)
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLogsLoading(false));
  }, [logTab]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Logs</h3>
      <div className="flex gap-2 mb-4">
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
      <div className="p-3 max-h-80 overflow-y-auto rounded-md border bg-muted/20">
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
      </div>
    </Card>
  );
}
