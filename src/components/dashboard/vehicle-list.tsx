'use client';
import type { VehicleWithStatus } from '@/lib/types';
import { VehicleCard } from './vehicle-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface VehicleListProps {
    vehicles: VehicleWithStatus[];
    selectedVehicleId: string | null | undefined;
    onSelectVehicle: (vehicle: VehicleWithStatus) => void;
}

export function VehicleList({ vehicles, selectedVehicleId, onSelectVehicle }: VehicleListProps) {
    
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isSelected={vehicle.id === selectedVehicleId}
          onClick={() => onSelectVehicle(vehicle)}
        />
      ))}
      <Button variant="outline" className="flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 p-1 text-muted-foreground hover:text-accent-foreground">
        <Plus className="h-5 w-5" />
        <span className="text-[10px] font-bold">NOVO</span>
      </Button>
    </div>
  );
}
