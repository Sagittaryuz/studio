'use client';
import { useState } from 'react';
import type { VehicleWithStatus, VehicleService, Service, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle } from 'lucide-react';
import { UpdateKmForm } from '@/components/vehicle/update-km-form';
import { AddMaintenanceSheet } from '@/components/vehicle/add-maintenance-sheet';
import { AiSuggestionModal } from '@/components/vehicle/ai-suggestion-modal';
import { cn } from '@/lib/utils';
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

export function MaintenanceTable({ vehicle, services, allServices, userRole }: MaintenanceTableProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  
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

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Manutenções - {vehicle.plate}</CardTitle>
            <CardDescription>Histórico e agendamentos de serviços do veículo.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <UpdateKmForm vehicle={vehicle} disabled={!canEdit} />
            {canEdit && (
                <Button onClick={() => setSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar Serviço
                </Button>
            )}
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
              {services.length > 0 ? services.map(service => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{getServiceName(service.serviceId)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeClasses[service.status]} className={cn(service.status === 'ALERTA' && 'bg-warning text-warning-foreground')}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {service.nextKm.toLocaleString('pt-BR')} km / {service.nextDate.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {service.lastKm.toLocaleString('pt-BR')} km / {service.lastDate.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        {canEdit && <DropdownMenuItem>Reagendar</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      {canEdit && (
          <AddMaintenanceSheet 
            isOpen={isSheetOpen}
            setIsOpen={setSheetOpen}
            vehicle={vehicle}
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
