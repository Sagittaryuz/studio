'use client';
import { useState } from 'react';
import type { VehicleWithStatus, VehicleService, Service, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle, Monitor } from 'lucide-react';
import { UpdateKmForm } from '@/components/vehicle/update-km-form';
import { AddMaintenanceSheet } from '@/components/vehicle/add-maintenance-sheet';
import { AiSuggestionModal } from '@/components/vehicle/ai-suggestion-modal';
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
  services: VehicleService[];
  allServices: Service[];
  userRole: UserRole;
}

const statusBadgeClasses: Record<string, string> = {
  VENCIDO: 'destructive',
  ALERTA: 'default',
  OK: 'secondary',
};

const statusOrder: Record<string, number> = {
  VENCIDO: 0,
  ALERTA: 1,
  OK: 2,
};

export function MaintenanceTable({ vehicle, services, allServices, userRole }: MaintenanceTableProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<VehicleService | null>(null);

  const handleOpenSheet = (service: VehicleService) => {
    setSelectedService(service);
    setSheetOpen(true);
  };
  
  const canEdit = userRole === 'admin' || userRole === 'operator';

  if (!vehicle) {
    return (
        <div className="mt-6 flex h-96 items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Selecione um veículo para ver os detalhes da manutenção.</p>
        </div>
    );
  }

  const getServiceName = (serviceId: string) => {
    return allServices.find(s => s.id === serviceId)?.name || 'Serviço desconhecido';
  };

  const sortedServices = [...services].sort((a, b) => {
    const orderA = statusOrder[a.status];
    const orderB = statusOrder[b.status];
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // If statuses are the same, you might want a secondary sort, e.g., by next date
    return a.nextDate.getTime() - b.nextDate.getTime();
  });


  return (
    <>
      <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
             <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">
                Detalhes do Veículo: <span className="font-bold text-primary">{vehicle.plate}</span>
              </CardTitle>
            </div>
            <CardDescription>
                KM Atual: {vehicle.currentKm.toLocaleString('pt-BR')} km. Histórico e agendamentos de serviços.
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
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próxima Manutenção</TableHead>
                <TableHead>Última Manutenção</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedServices.length > 0 ? sortedServices.map(service => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{getServiceName(service.serviceId)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeClasses[service.status]} className={cn(service.status === 'ALERTA' && 'bg-warning text-warning-foreground')}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {service.nextKm > 0 && Number.isFinite(service.nextKm) ? `${service.nextKm.toLocaleString('pt-BR')} km` : ''}
                    {service.nextKm > 0 && Number.isFinite(service.nextKm) && service.nextDate < new Date('2999-01-01') ? ' / ' : ''}
                    {service.nextDate < new Date('2999-01-01') ? service.nextDate.toLocaleDateString('pt-BR') : ''}
                  </TableCell>
                  <TableCell>
                    {service.lastDate.getFullYear() > 2000 ? `${service.lastKm.toLocaleString('pt-BR')} km / ${service.lastDate.toLocaleDateString('pt-BR')}` : 'Nunca realizado'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                          <Button onClick={() => handleOpenSheet(service)} size="sm">
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
                            <Link href={`/history/${vehicle.id}/${service.serviceId}`}>
                                Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && <DropdownMenuItem>Reagendar</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum serviço de manutenção encontrado para este veículo.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {canEdit && selectedService && (
          <AddMaintenanceSheet 
            isOpen={isSheetOpen}
            setIsOpen={setIsOpen}
            vehicle={vehicle}
            service={selectedService}
            allServices={allServices}
          />
      )}
      <AiSuggestionModal
        isOpen={isAiModalOpen}
        setIsOpen={setAiModalOpen}
        vehicle={vehicle}
        serviceHistory={services}
        allServices={allServices}
       />
    </>
  );
}
