import { getDashboardData } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  // On a real app, you'd fetch this from your database (e.g., Firestore)
  // and pass the currently logged-in user's role.
  const initialData = await getDashboardData('admin');

  return (
      <DashboardClient initialData={initialData} />
  );
}
