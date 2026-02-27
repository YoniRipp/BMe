import { PageTitle } from '@/components/layout/PageTitle';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminLogs } from '@/components/admin/AdminLogs';

export function Admin() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageTitle title="Admin" subtitle="Manage users and view logs" />
      <AdminUsersTable />
      <AdminLogs />
    </div>
  );
}
