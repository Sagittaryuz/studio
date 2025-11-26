'use client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleWithStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  vehicle: VehicleWithStatus;
  isSelected: boolean;
  onClick: () => void;
}

const statusClasses: Record<string, string> = {
  VENCIDO: 'border-destructive bg-destructive/10',
  ALERTA: 'border-warning bg-warning/10',
  OK: 'border-transparent',
};

export function VehicleCard({ vehicle, isSelected, onClick }: VehicleCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-2',
        !isSelected && (statusClasses[vehicle.status] || 'border-transparent')
      )}
      onClick={onClick}
    >
      <CardHeader className="p-1">
        <div className="flex items-center justify-between gap-1">
            <CardTitle className="text-xs font-bold truncate">{vehicle.plate}</CardTitle>
            <Badge 
              variant={vehicle.status === 'ALERTA' ? 'default' : vehicle.status === 'VENCIDO' ? 'destructive' : 'secondary'} 
              className={cn('text-[9px] px-1 py-0', vehicle.status === 'ALERTA' && 'bg-warning text-warning-foreground')}
            >
              {vehicle.status}
            </Badge>
        </div>
        <CardDescription className="text-[10px]">{vehicle.currentKm.toLocaleString('pt-BR')} km</CardDescription>
      </CardHeader>
    </Card>
  );
}
