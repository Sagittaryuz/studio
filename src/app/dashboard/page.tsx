import { getDashboardData } from '@/lib/data';
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { AppLayout } from '@/components/layout/app-layout';


export default async function DashboardPage() {
  const initialData = await getDashboardData('admin');

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          <ExpenseChart data={initialData} />
          <DashboardCalendar 
            vehicles={initialData.vehicles}
            services={initialData.services}
            vehicleServices={initialData.vehicleServices}
          />
        </div>
      </div>
    </AppLayout>
  );
}
