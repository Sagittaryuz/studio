'use client';
import { useState, useMemo, useEffect } from 'react';
import type { VehicleWithStatus, VehicleService, Service, UserRole, MergedServiceData, CorrectiveServiceRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle, Monitor, ShieldCheck } from 'lucide-react';
import { UpdateKmForm } from '@/components/vehicle/update-km-form';
import { AddMaintenanceSheet } from '@/components/vehicle/add-maintenance-sheet';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '../ui/input';
import { addVehicleService } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList } from '../ui/tabs';
import { CorrectiveMaintenanceTable } from './corrective-maintenance-table';

interface MaintenanceTableProps {
  vehicle: VehicleWithStatus | null;
  servicesForCategory: Service[];
  vehicleServices: VehicleService[];
  correctiveServicesForVehicle: CorrectiveServiceRecord[];
  userRole: UserRole;
}

const statusClasses: Record<string, string> = {
  VENCIDO: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  ALERTA: 'bg-warning text-warning-foreground hover:bg-warning/90',
  OK: 'bg-green-600 text-white hover:bg-green-700',
};

const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function MaintenanceTable({ vehicle, servicesForCategory, vehicleServices, correctiveServicesForVehicle, userRole }: MaintenanceTableProps) {
  const [isAddSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<MergedServiceData | null>(null);
  const [localVehicleServices, setLocalVehicleServices] = useState<VehicleService[]>(vehicleServices);
  const { toast } = useToast();

  useEffect(() => {
    setLocalVehicleServices(vehicleServices);
  }, [vehicleServices]);

  const handleOpenAddSheet = (data: MergedServiceData) => {
    setSelectedServiceData(data);
    setAddSheetOpen(true);
  };
  
  const canEdit = userRole === 'admin' || userRole === 'operator';

  const mergedData: MergedServiceData[] = useMemo(() => {
    if (!vehicle) return [];
    
    const sortedCategoryServices = [...servicesForCategory].sort((a,b) => a.order - b.order);
    
    return sortedCategoryServices.map(serviceInfo => {
      const vehicleService = localVehicleServices.find(vs => vs.serviceId === serviceInfo.id && vs.vehicleId === vehicle.id) || null;
      return { serviceInfo, vehicleService };
    });
  }, [vehicle, servicesForCategory, localVehicleServices]);

  const handleParamChange = async (serviceId: string, param: 'km' | 'months', value: number) => {
      if (!vehicle) return;

      const existingService = localVehicleServices.find(vs => vs.vehicleId === vehicle.id && vs.serviceId === serviceId);

      const updatedService = {
          vehicleId: vehicle.id,
          serviceId: serviceId,
          lastKm: existingService?.lastKm || 0,
          lastDate: existingService?.lastDate || new Date(2000, 0, 1),
          supplier: existingService?.supplier || '-',
          responsible: existingService?.responsible || '-',
          km: param === 'km' ? value : existingService?.km,
          months: param === 'months' ? value : existingService?.months,
      };

      try {
        // We call the server action to persist this change
        await addVehicleService(updatedService);
        
        // This is a mock of re-fetching the data after update.
        // In a real app with live data, this would update automatically.
        const newVs = { ...updatedService, id: existingService?.id || `new-${Date.now()}` }
        
        setLocalVehicleServices(prev => {
            const index = prev.findIndex(p => p.id === newVs.id);
            if (index > -1) {
                const newState = [...prev];
                newState[index] = { ...newState[index], ...newVs };
                return newState;
            }
            return [...prev, newVs as VehicleService];
        })

      } catch (error) {
          toast({ title: "Erro ao atualizar parâmetro", variant: 'destructive' });
      }
  };


  if (!vehicle) {
    return (
        <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-muted p-8 text-center text-muted-foreground">
            <p>Selecione um veículo para ver os detalhes da manutenção.</p>
        </div>
    );
  }

  return (
    <>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">
                Plano de Manutenção: <span className="font-bold text-primary">{vehicle.plate}</span>
              </CardTitle>
            </div>
            <CardDescription className="text-sm pt-1">
                KM Atual: {vehicle.currentKm.toLocaleString('pt-BR')} km.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <UpdateKmForm vehicle={vehicle} disabled={!canEdit} />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          <Tabs defaultValue="preventive" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preventive">Manutenções Preventivas</TabsTrigger>
              <TabsTrigger value="corrective">Manutenções Corretivas</TabsTrigger>
            </TabsList>
            <TabsContent value="preventive">
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/40 h-6'>
                    <TableHead className='align-middle p-1' rowSpan={2}>Serviço</TableHead>
                    <TableHead className="text-center p-1" colSpan={2}>Parâmetros</TableHead>
                    <TableHead className="bg-muted/20 text-center p-1" colSpan={5}>Última Manutenção</TableHead>
                    <TableHead className="bg-muted/60 text-center align-middle p-1" rowSpan={2}>Próxima Manutenção</TableHead>
                    <TableHead className='text-center align-middle p-1' rowSpan={2}>Status</TableHead>
                    <TableHead className="text-right align-middle p-1" rowSpan={2}>Ações</TableHead>
                  </TableRow>
                  <TableRow className='bg-muted/40 h-6'>
                    <TableHead className="text-center font-semibold p-1 h-6">Meses</TableHead>
                    <TableHead className="text-center font-semibold p-1 h-6">KM</TableHead>
                    <TableHead className="bg-muted/20 font-semibold p-1 h-6">Fornecedor</TableHead>
                    <TableHead className="bg-muted/20 font-semibold p-1 h-6">Data</TableHead>
                    <TableHead className="bg-muted/20 font-semibold p-1 h-6">KM</TableHead>
                    <TableHead className="bg-muted/20 font-semibold p-1 h-6">Custo</TableHead>
                    <TableHead className="bg-muted/20 font-semibold p-1 h-6">Garantia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mergedData.length > 0 ? mergedData.map(data => {
                    const { serviceInfo, vehicleService } = data;
                    const hasBeenServiced = vehicleService && vehicleService.lastKm > 0;
                    
                    return (
                        <TableRow key={serviceInfo.id} className={cn('h-10', vehicleService?.status === 'VENCIDO' ? 'bg-destructive/10' : vehicleService?.status === 'ALERTA' ? 'bg-warning/10' : '')}>
                          <TableCell className="font-medium text-left p-1 text-sm">{serviceInfo.name}</TableCell>
                          
                          <TableCell className="text-center p-1 w-24">
                            <Input
                              type="number"
                              defaultValue={vehicleService?.months}
                              onBlur={(e) => handleParamChange(serviceInfo.id, 'months', parseInt(e.target.value, 10))}
                              className="h-8 text-center text-sm"
                              disabled={!canEdit}
                            />
                          </TableCell>
                          <TableCell className="text-center p-1 w-32">
                            <Input
                              type="number"
                              defaultValue={vehicleService?.km}
                              onBlur={(e) => handleParamChange(serviceInfo.id, 'km', parseInt(e.target.value, 10))}
                              className="h-8 text-center text-sm"
                              disabled={!canEdit}
                            />
                          </TableCell>
                          
                          {/* Última Manutenção */}
                          <TableCell className="bg-muted/20 text-center p-1 text-sm">{hasBeenServiced ? vehicleService.supplier : '-'}</TableCell>
                          <TableCell className="bg-muted/20 text-center p-1 text-sm">{hasBeenServiced ? vehicleService.lastDate.toLocaleDateString('pt-BR') : 'Nunca realizado'}</TableCell>
                          <TableCell className="bg-muted/20 text-center p-1 text-sm">{hasBeenServiced ? vehicleService.lastKm.toLocaleString('pt-BR') : '-'}</TableCell>
                          <TableCell className="bg-muted/20 text-center p-1 text-sm font-semibold">{hasBeenServiced ? formatCurrency(vehicleService.cost) : '-'}</TableCell>
                          <TableCell className="bg-muted/20 text-center p-1 text-sm">{hasBeenServiced && vehicleService.warrantyDate ? vehicleService.warrantyDate.toLocaleDateString('pt-BR') : '-'}</TableCell>
                          
                          {/* Próxima Manutenção */}
                          <TableCell className="bg-muted/60 text-center font-semibold p-1 text-sm">
                            {hasBeenServiced ? (
                                <>
                                  {vehicleService.months && vehicleService.months > 0 ? vehicleService.nextDate.toLocaleDateString('pt-BR') : ''}
                                  {vehicleService.months && vehicleService.months > 0 && vehicleService.km && vehicleService.km > 0 ? <span className='mx-1'>/</span> : ''}
                                  {vehicleService.km && vehicleService.km > 0 ? `${vehicleService.nextKm.toLocaleString('pt-br')} km` : ''}
                                </>
                            ) : '-'}
                          </TableCell>

                          {/* Status */}
                          <TableCell className='text-center p-1'>
                            <Badge className={cn('font-bold w-[70px] justify-center px-2 py-1 text-xs', statusClasses[vehicleService?.status || 'OK'])}>
                                {vehicleService?.status || 'OK'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right p-1">
                            <div className="flex items-center justify-end">
                              {canEdit && (
                                  <Button onClick={() => handleOpenAddSheet(data)} size="sm" variant="outline" className="h-8 px-2">
                                      <PlusCircle className="mr-2 h-4 w-4" /> Registrar
                                  </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/history/${vehicle.id}/${serviceInfo.id}`}>
                                        Ver Histórico
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                    )
                  }) : (
                    <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                            Nenhum tipo de serviço encontrado para esta categoria de veículo.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="corrective">
              <CorrectiveMaintenanceTable 
                vehicle={vehicle} 
                records={correctiveServicesForVehicle}
                canEdit={canEdit}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {canEdit && selectedServiceData && (
          <AddMaintenanceSheet 
            isOpen={isAddSheetOpen}
            setIsOpen={setAddSheetOpen}
            vehicle={vehicle}
            serviceInfo={selectedServiceData.serviceInfo}
            vehicleService={selectedServiceData.vehicleService}
          />
      )}
    </>
  );
}
