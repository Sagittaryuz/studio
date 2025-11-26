'use client';

import { useState, useMemo, useEffect } from 'react';
import type { DashboardData, VehicleWithStatus, CategoryWithStatus, Service, VehicleService } from '@/lib/types';
import { AppHeader } from '@/components/layout/app-header';
import { VehicleList } from '@/components/dashboard/vehicle-list';
import { MaintenanceTable } from '@/components/dashboard/maintenance-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Plus, Cog } from 'lucide-react';
import Link from 'next/link';


const badgeStatusClasses: Record<string, string> = {
  VENCIDO: 'bg-destructive text-destructive-foreground',
  ALERTA: 'bg-warning text-warning-foreground',
};

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData.categories[0]?.id || '');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);

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
  
  return (
    <div className="flex h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col overflow-y-hidden p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Painel de Controle</h2>
            <Button asChild variant="outline">
                <Link href="/services">
                    <Cog className="mr-2 h-4 w-4" />
                    Gerenciar Serviços
                </Link>
            </Button>
        </div>
        <Tabs value={selectedCategory} onValueChange={handleSelectCategory} className="mt-4">
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
             <TabsContent key={category.id} value={category.id} className="flex-1">
                <div className="mt-4">
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
                            <Button variant="outline">
                              <Plus className="mr-2 h-4 w-4" /> Adicionar Veículo
                            </Button>
                          </div>
                      </div>
                  )}
                </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex-1 overflow-y-auto">
            <MaintenanceTable 
                vehicle={selectedVehicle}
                servicesForCategory={servicesByCategory[selectedCategory] || []}
                vehicleServices={initialData.vehicleServices}
                userRole={initialData.userRole}
            />
        </div>
      </main>
    </div>
  );
}
