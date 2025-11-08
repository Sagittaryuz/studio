'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleWithStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  vehicle: VehicleWithStatus;
  isSelected: boolean;
  onClick: () => void;
}

const statusClasses: Record<string, string> = {
  VENCIDO: 'border-destructive',
  ALERTA: 'border-warning',
  OK: 'border-green-500',
};

const statusBadge: Record<string, string> = {
    VENCIDO: 'destructive',
    ALERTA: 'default',
    OK: 'secondary',
}

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
      <CardHeader className="p-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">{vehicle.plate}</CardTitle>
            <Badge variant={vehicle.status === 'ALERTA' ? 'default' : vehicle.status === 'VENCIDO' ? 'destructive' : 'secondary'} className={cn('text-xs', vehicle.status === 'ALERTA' && 'bg-warning text-warning-foreground')}>{vehicle.status}</Badge>
        </div>
        <CardDescription className="text-xs">{vehicle.currentKm.toLocaleString('pt-BR')} km</CardDescription>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div data-ai-hint="truck front" className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image
                src={vehicle.photoUrl}
                alt={`Veículo ${vehicle.plate}`}
                fill
                className="object-cover"
            />
        </div>
      </CardContent>
    </Card>
  );
}
