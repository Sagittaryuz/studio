
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardProvider } from '@/components/dashboard/dashboard-provider';

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


export default function PlanPage() {
  return (
    <AppLayout>
      <Suspense fallback={<DashboardFallback />}>
        <DashboardProvider>
            <DashboardClient />
        </DashboardProvider>
      </Suspense>
    </AppLayout>
  );
}
