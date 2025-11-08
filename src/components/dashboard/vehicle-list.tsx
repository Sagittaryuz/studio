'use client';
import type { VehicleWithStatus } from '@/lib/types';
import { VehicleCard } from './vehicle-card';

interface VehicleListProps {
    vehicles: VehicleWithStatus[];
    selectedVehicleId: string | null | undefined;
    onSelectVehicle: (vehicle: VehicleWithStatus) => void;
}

export function VehicleList({ vehicles, selectedVehicleId, onSelectVehicle }: VehicleListProps) {
    if (vehicles.length === 0) {
        return (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <p>Nenhum veículo encontrado nesta categoria.</p>
            </div>
        )
    }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isSelected={vehicle.id === selectedVehicleId}
          onClick={() => onSelectVehicle(vehicle)}
        />
      ))}
    </div>
  );
}
