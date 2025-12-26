
'use client';
import { ServiceManagementClient } from './service-management-client';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardProvider, useDashboard } from '@/components/dashboard/dashboard-provider';
import { Skeleton } from '@/components/ui/skeleton';


function ServiceManagementContent() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <Skeleton className='h-[600px] w-full' />
            </div>
        </main>
    )
  }

  return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <ServiceManagementClient
                    initialServices={data.services} 
                    categories={data.categories}
                />
            </div>
        </main>
  );
}

export default function ServiceManagementPage() {
  return (
    <AppLayout>
        <DashboardProvider>
            <ServiceManagementContent />
        </DashboardProvider>
    </AppLayout>
  );
}
