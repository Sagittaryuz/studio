
import { getDashboardData } from '@/lib/data';
import { ServiceManagementClient } from './service-management-client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ServiceManagementClientWithNoSSR = dynamic(
  () => import('./service-management-client').then(mod => mod.ServiceManagementClient),
  { 
    ssr: false,
    loading: () => (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    )
  }
);


export default async function ServiceManagementPage() {
  const data = await getDashboardData('admin'); // Assuming admin role for now

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
            <ServiceManagementClientWithNoSSR
                initialServices={data.services} 
                categories={data.categories}
            />
        </div>
    </main>
  );
}
