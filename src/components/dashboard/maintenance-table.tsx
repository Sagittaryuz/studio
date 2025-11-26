'use client';
import { useState, useMemo } from 'react';
import type { VehicleWithStatus, VehicleService, Service, UserRole, MergedServiceData, CategoryID } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle, Monitor, FileText } from 'lucide-react';
import { UpdateKmForm } from '@/components/vehicle/update-km-form';
import { AddMaintenanceSheet } from '@/components/vehicle/add-maintenance-sheet';
import { AiSuggestionModal } from '@/components/vehicle/ai-suggestion-modal';
import { EditNotesModal } from '@/components/vehicle/edit-notes-modal';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MaintenanceTableProps {
  vehicle: VehicleWithStatus | null;
  servicesForCategory: Service[];
  vehicleServices: VehicleService[];
  userRole: UserRole;
}

const statusClasses: Record<string, string> = {
  VENCIDO: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  ALERTA: 'bg-warning text-warning-foreground hover:bg-warning/90',
  OK: 'bg-green-600 text-white hover:bg-green-700',
};

export function MaintenanceTable({ vehicle, servicesForCategory, vehicleServices, userRole }: MaintenanceTableProps) {
  const [isAddSheetOpen, setAddSheetOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isNotesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<MergedServiceData | null>(null);

  const handleOpenAddSheet = (data: MergedServiceData) => {
    setSelectedServiceData(data);
    setAddSheetOpen(true);
  };
  
  const handleOpenNotesModal = (data: MergedServiceData) => {
    setSelectedServiceData(data);
    setNotesModalOpen(true);
  };
  
  const canEdit = userRole === 'admin' || userRole === 'operator';

  // This is the core logic change.
  // We merge the list of all services for the category with the actual service history of the vehicle.
  const mergedData: MergedServiceData[] = useMemo(() => {
    if (!vehicle) return [];
    
    // Sort all services for the category by the defined order
    const sortedCategoryServices = [...servicesForCategory].sort((a,b) => a.order - b.order);
    
    return sortedCategoryServices.map(serviceInfo => {
      const vehicleService = vehicleServices.find(vs => vs.serviceId === serviceInfo.id && vs.vehicleId === vehicle.id) || null;
      return { serviceInfo, vehicleService };
    });
  }, [vehicle, servicesForCategory, vehicleServices]);


  if (!vehicle) {
    return (
        <div className="mt-6 flex h-96 items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Selecione um veículo para ver os detalhes da manutenção.</p>
        </div>
    );
  }

  return (
    <>
      <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
             <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">
                Plano de Manutenção: <span className="font-bold text-primary">{vehicle.plate}</span>
              </CardTitle>
            </div>
            <CardDescription>
                KM Atual: {vehicle.currentKm.toLocaleString('pt-BR')} km.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <UpdateKmForm vehicle={vehicle} disabled={!canEdit} />
             <Button variant="outline" onClick={() => setAiModalOpen(true)}>
                Sugerir com IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/30'>
                <TableHead className='w-1/4'>Serviço</TableHead>
                <TableHead className="bg-muted/50 text-center" colSpan={2}>Parâmetros</TableHead>
                <TableHead className="bg-yellow-100/50 dark:bg-yellow-900/30 text-center" colSpan={3}>Última Manutenção</TableHead>
                <TableHead className="bg-gray-800 dark:bg-gray-700 text-white text-center">Próxima Manutenção</TableHead>
                <TableHead className='text-center'>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
              <TableRow className='bg-muted/30'>
                <TableHead></TableHead>
                <TableHead className="bg-muted/50 text-center font-semibold">Meses</TableHead>
                <TableHead className="bg-muted/50 text-center font-semibold">KM</TableHead>
                <TableHead className="bg-yellow-100/50 dark:bg-yellow-900/30 font-semibold">Fornecedor</TableHead>
                <TableHead className="bg-yellow-100/50 dark:bg-yellow-900/30 font-semibold">Data</TableHead>
                <TableHead className="bg-yellow-100/50 dark:bg-yellow-900/30 font-semibold">KM</TableHead>
                <TableHead className="bg-gray-800 dark:bg-gray-700 text-white font-semibold text-center">Data / KM</TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedData.length > 0 ? mergedData.map(data => {
                const { serviceInfo, vehicleService } = data;
                const hasBeenServiced = vehicleService && vehicleService.lastKm > 0;
                
                return (
                    <TableRow key={serviceInfo.id} className={cn(vehicleService?.status === 'VENCIDO' ? 'bg-destructive/10' : vehicleService?.status === 'ALERTA' ? 'bg-warning/10' : '')}>
                      <TableCell className="font-medium">{serviceInfo.name}</TableCell>
                      
                      {/* Parâmetros */}
                      <TableCell className="bg-muted/50 text-center">{serviceInfo.defaultMonths > 0 ? serviceInfo.defaultMonths : '-'}</TableCell>
                      <TableCell className="bg-muted/50 text-center">{serviceInfo.defaultKm > 0 ? serviceInfo.defaultKm.toLocaleString('pt-BR') : '-'}</TableCell>
                      
                      {/* Última Manutenção */}
                      <TableCell className="bg-yellow-100/50 dark:bg-yellow-900/30">{hasBeenServiced ? vehicleService.supplier : 'N/A'}</TableCell>
                      <TableCell className="bg-yellow-100/50 dark:bg-yellow-900/30">{hasBeenServiced ? vehicleService.lastDate.toLocaleDateString('pt-BR') : 'Nunca realizado'}</TableCell>
                      <TableCell className="bg-yellow-100/50 dark:bg-yellow-900/30">{hasBeenServiced ? vehicleService.lastKm.toLocaleString('pt-BR') : '-'}</TableCell>
                      
                      {/* Próxima Manutenção */}
                      <TableCell className="bg-gray-800 dark:bg-gray-700 text-white text-center">
                        {hasBeenServiced ? (
                             <>
                                {serviceInfo.defaultMonths > 0 ? vehicleService.nextDate.toLocaleDateString('pt-BR') : ''}
                                {serviceInfo.defaultMonths > 0 && serviceInfo.defaultKm > 0 ? <span className='mx-1'>/</span> : ''}
                                {serviceInfo.defaultKm > 0 ? `${vehicleService.nextKm.toLocaleString('pt-br')} km` : ''}
                             </>
                        ) : '-'}
                      </TableCell>

                      {/* Status */}
                      <TableCell className='text-center'>
                         <Badge className={cn('text-xs font-bold w-[80px] justify-center', statusClasses[vehicleService?.status || 'OK'])}>
                            {vehicleService?.status || 'OK'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                              <Button onClick={() => handleOpenAddSheet(data)} size="sm">
                                  <PlusCircle className="mr-2 h-4 w-4" /> Registrar
                              </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem asChild>
                                <Link href={`/history/${vehicle.id}/${serviceInfo.id}`}>
                                    Ver Histórico
                                </Link>
                              </DropdownMenuItem>
                              {canEdit && vehicleService && (
                                <DropdownMenuItem onClick={() => handleOpenNotesModal(data)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Obs.
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                )
              }) : (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        Nenhum tipo de serviço encontrado para esta categoria de veículo.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
      {canEdit && selectedServiceData?.vehicleService && (
        <EditNotesModal
            isOpen={isNotesModalOpen}
            setIsOpen={setNotesModalOpen}
            vehicleService={selectedServiceData.vehicleService}
        />
      )}
      <AiSuggestionModal
        isOpen={isAiModalOpen}
        setIsOpen={setAiModalOpen}
        vehicle={vehicle}
        serviceHistory={vehicleServices}
        allServices={servicesForCategory}
       />
    </>
  );
}
