
import { getDashboardData } from '@/lib/data';
import { ServiceManagementClient } from './service-management-client';
import { AppLayout } from '@/components/layout/app-layout';


export default async function ServiceManagementPage() {
  const data = await getDashboardData('admin'); // Assuming admin role for now

  return (
    <AppLayout>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <ServiceManagementClient
                    initialServices={data.services} 
                    categories={data.categories}
                />
            </div>
        </main>
    </AppLayout>
  );
}
