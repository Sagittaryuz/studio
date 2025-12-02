'use client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleWithStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  vehicle: VehicleWithStatus;
  isSelected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const statusIndicatorClasses: Record<string, string> = {
  VENCIDO: 'absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-background',
  ALERTA: 'absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warning border-2 border-background',
};

export function VehicleCard({ vehicle, isSelected, onClick, children }: VehicleCardProps) {
  return (
    <div className="relative">
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'border-2'
        )}
        onClick={onClick}
      >
        <CardHeader className="p-1">
          <div className="flex items-start justify-between gap-1">
              <div className='flex-1'>
                  {vehicle.fleetNumber && (
                      <p className="text-[9px] font-bold text-muted-foreground">{vehicle.fleetNumber}</p>
                  )}
                  <CardTitle className="text-xs font-bold truncate">{vehicle.plate}</CardTitle>
              </div>
          </div>
          <CardDescription className="text-[10px]">{vehicle.currentKm.toLocaleString('pt-BR')} km</CardDescription>
        </CardHeader>
        {children && <div className="absolute top-0.5 right-0.5">{children}</div>}
      </Card>
      {vehicle.status !== 'OK' && (
        <div className={cn(statusIndicatorClasses[vehicle.status])} title={`Status: ${vehicle.status}`} />
      )}
    </div>
  );
}