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

const statusClasses: Record<string, string> = {
  VENCIDO: 'border-destructive bg-destructive/10',
  ALERTA: 'border-warning bg-warning/10',
  OK: 'border-transparent',
};

export function VehicleCard({ vehicle, isSelected, onClick, children }: VehicleCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md relative',
        isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-2',
        !isSelected && (statusClasses[vehicle.status] || 'border-transparent')
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
            <Badge 
              variant={vehicle.status === 'ALERTA' ? 'default' : vehicle.status === 'VENCIDO' ? 'destructive' : 'secondary'} 
              className={cn('text-[9px] px-1 py-0 h-4', vehicle.status === 'ALERTA' && 'bg-warning text-warning-foreground')}
            >
              {vehicle.status}
            </Badge>
        </div>
        <CardDescription className="text-[10px]">{vehicle.currentKm.toLocaleString('pt-BR')} km</CardDescription>
      </CardHeader>
      {children && <div className="absolute top-0 right-0">{children}</div>}
    </Card>
  );
}

    