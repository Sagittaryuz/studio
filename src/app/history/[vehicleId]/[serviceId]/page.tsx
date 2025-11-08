import { getDashboardData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppHeader } from '@/components/layout/app-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function ServiceHistoryPage({ params }: { params: { vehicleId: string; serviceId: string } }) {
  const { vehicleId, serviceId } = params;
  const data = await getDashboardData('admin'); // Assuming admin role for now

  const vehicle = data.vehicles.find(v => v.id === vehicleId);
  const serviceInfo = data.services.find(s => s.id === serviceId);
  
  // In a real app, you would fetch the full history for this specific service.
  // For this mock, we'll just filter the existing vehicleServices array.
  const serviceHistory = data.vehicleServices.filter(
    vs => vs.vehicleId === vehicleId && vs.serviceId === serviceId
  ).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());

  if (!vehicle || !serviceInfo) {
    return notFound();
  }

  return (
    <>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Painel
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Histórico de Serviço: {serviceInfo.name}</CardTitle>
                        <CardDescription>
                            Veículo: <span className='font-semibold text-primary'>{vehicle.plate}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Quilometragem</TableHead>
                                <TableHead>Fornecedor</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Anexos</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {serviceHistory.map(entry => (
                                <TableRow key={entry.id}>
                                <TableCell>{entry.lastDate.toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>{entry.lastKm.toLocaleString('pt-BR')} km</TableCell>
                                <TableCell>{entry.supplier}</TableCell>
                                <TableCell>{entry.responsible}</TableCell>
                                <TableCell>
                                    {entry.attachments && entry.attachments.length > 0 ? (
                                        <div className='flex flex-col gap-1'>
                                        {entry.attachments.map((att, index) => (
                                            <Button asChild variant="link" size="sm" key={index} className='p-0 h-auto'>
                                                <a href={att} target="_blank" rel="noopener noreferrer">
                                                    Ver anexo {index + 1}
                                                </a>
                                            </Button>
                                        ))}
                                        </div>
                                    ) : 'N/A'}
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    </>
  );
}
