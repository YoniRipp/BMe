import { PageTitle } from '@/components/layout/PageTitle';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminLogs } from '@/components/admin/AdminLogs';

export function Admin() {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Admin.tsx:Admin', message: 'Admin page render', data: {}, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {});
  // #endregion
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageTitle title="Admin" subtitle="Manage users and view logs" />
      <AdminUsersTable />
      <AdminLogs />
    </div>
  );
}
