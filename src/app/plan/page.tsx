import { Suspense } from 'react';
import { getDashboardData } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardFallback() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
}


export default async function PlanPage() {
  const initialData = await getDashboardData('admin');

  return (
      <Suspense fallback={<DashboardFallback />}>
        <DashboardClient initialData={initialData} />
      </Suspense>
  );
}
