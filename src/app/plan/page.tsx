import { getDashboardData } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function PlanPage() {
  const initialData = await getDashboardData('admin');

  return (
      <DashboardClient initialData={initialData} />
  );
}
