
import { getDashboardData } from '@/lib/data';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ServiceManagementClient } from './service-management-client';


export default async function ServiceManagementPage() {
  const data = await getDashboardData('admin'); // Assuming admin role for now

  return (
    <>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Painel
                    </Link>
                </Button>
                <ServiceManagementClient initialServices={data.services} />
            </div>
        </main>
    </>
  );
}
