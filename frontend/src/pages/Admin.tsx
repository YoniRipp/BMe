import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminLogs } from '@/components/admin/AdminLogs';
import { AdminOverviewCards } from '@/components/admin/AdminOverviewCards';
import { AdminCharts } from '@/components/admin/AdminCharts';
import { AdminSystemHealth } from '@/components/admin/AdminSystemHealth';

export function Admin() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <AdminOverviewCards />
      <AdminCharts />
      <AdminSystemHealth />
      <AdminUsersTable />
      <AdminLogs />
    </div>
  );
}
