'use client';
import { useState } from 'react';
import type { VehicleWithStatus, CategoryID } from '@/lib/types';
import { VehicleCard } from './vehicle-card';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { VehicleDialog } from '@/components/vehicle/add-vehicle-dialog';

interface VehicleListProps {
    vehicles: VehicleWithStatus[];
    selectedVehicleId: string | null | undefined;
    onSelectVehicle: (vehicle: VehicleWithStatus) => void;
    categoryId: CategoryID;
}

export function VehicleList({ vehicles, selectedVehicleId, onSelectVehicle, categoryId }: VehicleListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithStatus | null>(null);

  const handleOpenDialog = (vehicle: VehicleWithStatus | null) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };
    
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isSelected={vehicle.id === selectedVehicleId}
          onClick={() => onSelectVehicle(vehicle)}
        >
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 absolute top-0 right-0 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent card's onClick from firing
                    handleOpenDialog(vehicle);
                }}
            >
                <Edit className="h-3 w-3" />
            </Button>
        </VehicleCard>
      ))}
      <Button 
        variant="outline" 
        className="flex h-full min-h-[56px] w-full flex-col items-center justify-center gap-1 p-1 text-muted-foreground hover:text-accent-foreground"
        onClick={() => handleOpenDialog(null)}
        >
        <Plus className="h-5 w-5" />
        <span className="text-[10px] font-bold">NOVO</span>
      </Button>
      <VehicleDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        categoryId={categoryId}
        vehicle={editingVehicle}
      />
    </div>
  );
}

    