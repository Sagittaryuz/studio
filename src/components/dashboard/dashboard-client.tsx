'use client';

import { useState, useMemo, useEffect } from 'react';
import type { DashboardData, VehicleWithStatus, CategoryWithStatus, Service, VehicleService, CategoryID } from '@/lib/types';
import { MaintenanceTable } from '@/components/dashboard/maintenance-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Edit, Plus } from 'lucide-react';
import { VehicleList } from './vehicle-list';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { VehicleDialog } from '../vehicle/add-vehicle-dialog';
import { EditVehicleNotesDialog } from '../vehicle/edit-vehicle-notes-dialog';
import { SidebarTrigger } from '../ui/sidebar';


const badgeStatusClasses: Record<string, string> = {
  VENCIDO: 'bg-destructive text-destructive-foreground',
  ALERTA: 'bg-warning text-warning-foreground',
};

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData.categories[0]?.id || '');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);
  const [isVehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [isNotesDialogOpen, setNotesDialogOpen] = useState(false);


  const vehiclesByCategory = useMemo(() => {
    const grouped: { [key: string]: VehicleWithStatus[] } = {};
    initialData.categories.forEach(category => {
        grouped[category.id] = initialData.vehicles.filter(v => v.category === category.id && v.active);
    });
    return grouped;
  }, [initialData.vehicles, initialData.categories]);
  
  const servicesByCategory = useMemo(() => {
    const grouped: { [key: string]: Service[] } = {};
    initialData.categories.forEach(category => {
        grouped[category.id] = initialData.services.filter(s => s.categoryId === category.id);
    });
    return grouped;
  }, [initialData.services, initialData.categories]);


  // Effect to select the first vehicle when category changes
  useEffect(() => {
    const firstVehicleInCategory = vehiclesByCategory[selectedCategory]?.[0];
    setSelectedVehicle(firstVehicleInCategory || null);
  }, [selectedCategory, vehiclesByCategory]);


  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSelectVehicle = (vehicle: VehicleWithStatus) => {
    setSelectedVehicle(vehicle);
  };
  
  const handleOpenDialog = () => {
    setVehicleDialogOpen(true);
  };

  return (
    <>
    <div className="flex h-[calc(100vh)] w-full flex-col">
      <div className="flex h-12 items-center border-b px-2 md:px-4">
        <SidebarTrigger />
        <h1 className='ml-4 font-semibold text-lg'>Plano de Manutenção</h1>
      </div>
      <main className="flex flex-1 flex-col overflow-hidden p-2 md:p-4">
        
        <Tabs value={selectedCategory} onValueChange={handleSelectCategory} className="mt-1">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {initialData.categories.map((category: CategoryWithStatus) => (
              <TabsTrigger key={category.id} value={category.id} className="relative">
                {category.name}
                {category.pendingCount > 0 && (
                     <Badge className={cn("absolute -top-2 -right-2 h-5 w-5 justify-center p-0", badgeStatusClasses[category.status])}>
                        {category.pendingCount}
                    </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {initialData.categories.map(category => (
             <TabsContent key={category.id} value={category.id} className="flex-1 mt-2">
                <div className="">
                  {vehiclesByCategory[category.id] && vehiclesByCategory[category.id].length > 0 ? (
                      <VehicleList
                          vehicles={vehiclesByCategory[category.id] || []}
                          selectedVehicleId={selectedVehicle?.id}
                          onSelectVehicle={handleSelectVehicle}
                          categoryId={category.id}
                      />
                  ) : (
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                          <div className='flex flex-col items-center gap-4'>
                            <p>Nenhum veículo encontrado nesta categoria.</p>
                            <Button variant="outline" onClick={handleOpenDialog}>
                              <Plus className="mr-2 h-4 w-4" /> Adicionar Veículo
                            </Button>
                          </div>
                      </div>
                  )}
                </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex-1 overflow-y-auto mt-2 flex flex-col gap-2">
            <MaintenanceTable 
                vehicle={selectedVehicle}
                servicesForCategory={servicesByCategory[selectedCategory] || []}
                vehicleServices={initialData.vehicleServices}
                userRole={initialData.userRole}
            />
            {selectedVehicle && (
              <div className='flex-shrink-0'>
                <div className='flex items-center justify-between'>
                    <Label htmlFor='vehicle-notes'>Observações do Veículo</Label>
                    <Button variant="ghost" size="sm" onClick={() => setNotesDialogOpen(true)}>
                        <Edit className='mr-2 h-3 w-3' />
                        Editar
                    </Button>
                </div>
                <Textarea
                  id='vehicle-notes'
                  readOnly
                  value={selectedVehicle.notes || 'Nenhuma observação para este veículo.'}
                  className='text-xs mt-1'
                  rows={2}
                  />
              </div>
            )}
        </div>
      </main>
    </div>
    <VehicleDialog
      isOpen={isVehicleDialogOpen}
      setIsOpen={setVehicleDialogOpen}
      categoryId={selectedCategory as CategoryID}
      vehicle={null}
    />
    {selectedVehicle && (
        <EditVehicleNotesDialog
            isOpen={isNotesDialogOpen}
            setIsOpen={setNotesDialogOpen}
            vehicle={selectedVehicle}
        />
    )}
    </>
  );
}
