
'use client';
import { ReportsClient } from './reports-client';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardProvider, useDashboard } from '@/components/dashboard/dashboard-provider';
import { Skeleton } from '@/components/ui/skeleton';

function ReportsContent() {
    const { data, isLoading } = useDashboard();

    if (isLoading || !data) {
        return (
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className='h-12 w-48' />
                    <Skeleton className='h-64 w-full' />
                    <Skeleton className='h-96 w-full' />
                </div>
            </main>
        )
    }

    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Relatório de Despesas</h1>
              <ReportsClient initialData={data} />
          </div>
      </main>
    )
}

export default function ReportsPage() {
  return (
    <AppLayout>
      <DashboardProvider>
        <ReportsContent />
      </DashboardProvider>
    </AppLayout>
  );
}
