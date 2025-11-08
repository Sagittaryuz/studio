'use client';

import { useState, useMemo, useEffect } from 'react';
import type { DashboardData, VehicleWithStatus } from '@/lib/types';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { VehicleList } from '@/components/dashboard/vehicle-list';
import { MaintenanceTable } from '@/components/dashboard/maintenance-table';

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData.categories[0]?.id || '');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);

  const filteredVehicles = useMemo(() => {
    return initialData.vehicles.filter(v => v.category === selectedCategory && v.active);
  }, [selectedCategory, initialData.vehicles]);

  const maintenanceForSelectedVehicle = useMemo(() => {
    if (!selectedVehicle) return [];
    return initialData.vehicleServices.filter(vs => vs.vehicleId === selectedVehicle.id);
  }, [selectedVehicle, initialData.vehicleServices]);

  // Effect to select the first vehicle when category changes
  useEffect(() => {
    const firstVehicleInCategory = initialData.vehicles.find(v => v.category === selectedCategory && v.active);
    setSelectedVehicle(firstVehicleInCategory || null);
  }, [selectedCategory, initialData.vehicles]);


  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSelectVehicle = (vehicle: VehicleWithStatus) => {
    setSelectedVehicle(vehicle);
  };
  
  return (
    <SidebarProvider>
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav
          categories={initialData.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <VehicleList
                vehicles={filteredVehicles}
                selectedVehicleId={selectedVehicle?.id}
                onSelectVehicle={handleSelectVehicle}
            />
            
            <MaintenanceTable 
                vehicle={selectedVehicle}
                services={maintenanceForSelectedVehicle}
                allServices={initialData.services}
                userRole={initialData.userRole}
            />
        </main>
      </div>
    </SidebarProvider>
  );
}
