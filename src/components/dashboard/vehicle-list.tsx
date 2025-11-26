'use client';
import { useState } from 'react';
import type { VehicleWithStatus, CategoryID } from '@/lib/types';
import { VehicleCard } from './vehicle-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddVehicleDialog } from '@/components/vehicle/add-vehicle-dialog';

interface VehicleListProps {
    vehicles: VehicleWithStatus[];
    selectedVehicleId: string | null | undefined;
    onSelectVehicle: (vehicle: VehicleWithStatus) => void;
    categoryId: CategoryID;
}

export function VehicleList({ vehicles, selectedVehicleId, onSelectVehicle, categoryId }: VehicleListProps) {
  const [isAddVehicleOpen, setAddVehicleOpen] = useState(false);
    
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isSelected={vehicle.id === selectedVehicleId}
          onClick={() => onSelectVehicle(vehicle)}
        />
      ))}
      <Button 
        variant="outline" 
        className="flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 p-1 text-muted-foreground hover:text-accent-foreground"
        onClick={() => setAddVehicleOpen(true)}
        >
        <Plus className="h-5 w-5" />
        <span className="text-[10px] font-bold">NOVO</span>
      </Button>
      <AddVehicleDialog 
        isOpen={isAddVehicleOpen}
        setIsOpen={setAddVehicleOpen}
        categoryId={categoryId}
      />
    </div>
  );
}
