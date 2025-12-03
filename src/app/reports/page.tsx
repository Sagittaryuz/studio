import { getDashboardData } from '@/lib/data';
import { ReportsClient } from './reports-client';


export default async function ReportsPage() {
  const data = await getDashboardData('admin');

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Relatório de Despesas</h1>
            <ReportsClient initialData={data} />
        </div>
    </main>
  );
}
