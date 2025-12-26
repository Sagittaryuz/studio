
'use client';
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardProvider, useDashboard } from '@/components/dashboard/dashboard-provider';
import { Skeleton } from '@/components/ui/skeleton';


function DashboardContent() {
    const { data, isLoading } = useDashboard();

    if (isLoading || !data) {
        return (
             <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                 <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    <Skeleton className='h-[450px]' />
                    <Skeleton className='h-[450px]' />
                 </div>
             </div>
        )
    }

    return (
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          <ExpenseChart data={data} />
          <DashboardCalendar 
            vehicles={data.vehicles}
            services={data.services}
            vehicleServices={data.vehicleServices}
          />
        </div>
      </div>
    )
}


export default function DashboardPage() {
  return (
    <AppLayout>
        <DashboardProvider>
            <DashboardContent />
        </DashboardProvider>
    </AppLayout>
  );
}
