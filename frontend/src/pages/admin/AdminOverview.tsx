import { AdminOverviewCards } from '@/components/admin/AdminOverviewCards';
import { AdminCharts } from '@/components/admin/AdminCharts';
import { AdminFlaggedUsers } from '@/components/admin/AdminFlaggedUsers';

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <AdminOverviewCards />
      <AdminCharts />
      <AdminFlaggedUsers />
    </div>
  );
}
