'use client'

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle, Service, VehicleService } from '@/lib/types';
import { isSameDay, parseISO, format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';

interface DashboardCalendarProps {
  vehicles: Vehicle[];
  services: Service[];
  vehicleServices: VehicleService[];
}

const statusClasses: Record<string, string> = {
  VENCIDO: 'bg-destructive text-destructive-foreground',
  ALERTA: 'bg-warning text-warning-foreground',
  OK: 'bg-green-600 text-white',
  GARANTIA: 'bg-blue-500 text-white',
};

type CalendarEvent = {
    date: Date;
    type: 'VENCIDO' | 'ALERTA' | 'OK' | 'GARANTIA';
    vehicleId: string;
    serviceId: string;
    id: string;
}

export function DashboardCalendar({ vehicles, services, vehicleServices }: DashboardCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const events = useMemo(() => {
    const maintenanceEvents: CalendarEvent[] = vehicleServices
      .filter(vs => vs.nextDate < new Date('2999-01-01')) // Filter out 'infinite' dates
      .map(vs => ({
        date: vs.nextDate,
        type: vs.status,
        vehicleId: vs.vehicleId,
        serviceId: vs.serviceId,
        id: `m-${vs.id}`,
      }));

    const warrantyEvents: CalendarEvent[] = vehicleServices
        .filter(vs => vs.warrantyDate && isAfter(vs.warrantyDate, new Date()))
        .map(vs => ({
            date: vs.warrantyDate!,
            type: 'GARANTIA',
            vehicleId: vs.vehicleId,
            serviceId: vs.serviceId,
            id: `w-${vs.id}`,
        }));

    return [...maintenanceEvents, ...warrantyEvents];
  }, [vehicleServices]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter(event => isSameDay(event.date, selectedDate))
      .map(event => {
        const vehicle = vehicles.find(v => v.id === event.vehicleId);
        const service = services.find(s => s.id === event.serviceId);
        const vs = vehicleServices.find(vs => vs.id === event.id.substring(2));
        return {
          ...event,
          vehicle,
          service,
          vs,
        };
      })
      .sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [selectedDate, events, vehicles, services, vehicleServices]);

  const DayWithDot = ({ date, children }: { date: Date; children: React.ReactNode }) => {
    const dayEvents = events.filter(event => isSameDay(event.date, date));
    if (dayEvents.length === 0) return <>{children}</>;
    
    const hasWarranty = dayEvents.some(e => e.type === 'GARANTIA');
    const hasVencido = dayEvents.some(e => e.type === 'VENCIDO');
    const hasAlerta = dayEvents.some(e => e.type === 'ALERTA');

    return (
      <div className="relative">
        {children}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {hasVencido && <div className={cn("h-1.5 w-1.5 rounded-full", statusClasses['VENCIDO'])}></div>}
            {hasAlerta && <div className={cn("h-1.5 w-1.5 rounded-full", statusClasses['ALERTA'])}></div>}
            {hasWarranty && <div className={cn("h-1.5 w-1.5 rounded-full", statusClasses['GARANTIA'])}></div>}
        </div>
      </div>
    );
  };
  
  return (
    <Card>
        <CardContent className="p-0 flex flex-col">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-4 self-center"
                locale={ptBR}
                components={{
                    Day: ({ date, ...props }) => <DayWithDot date={date}>{props.children || date.getDate()}</DayWithDot>,
                }}
            />
            <div className='border-t p-4'>
                <CardHeader className='p-0 mb-4'>
                <CardTitle className='text-base'>
                    {selectedDate ? `Eventos para ${format(selectedDate, "PPP", { locale: ptBR })}` : 'Selecione uma data'}
                </CardTitle>
                </CardHeader>
                <CardContent className='p-0 max-h-48 overflow-y-auto'>
                {selectedDayEvents.length > 0 ? (
                    <ul className="space-y-3">
                    {selectedDayEvents.map(event => (
                        <li key={event.id} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className='flex justify-between items-start'>
                            <div>
                                <p className="font-semibold text-sm">{event.service?.name}</p>
                                <p className="text-xs text-muted-foreground">{event.vehicle?.plate}</p>
                            </div>
                            <Badge className={cn("text-xs", statusClasses[event.type])}>
                                {event.type === 'GARANTIA' ? 'FIM GARANTIA' : event.type}
                            </Badge>
                        </div>
                        {event.type !== 'GARANTIA' && (
                             <div className="text-xs mt-2 text-muted-foreground">
                                <p>KM Próximo: {event.vs?.nextKm.toLocaleString('pt-br')} km</p>
                                <p>Responsável: {event.vs?.responsible}</p>
                            </div>
                        )}
                       
                        <Button asChild size="sm" variant="link" className='p-0 h-auto mt-2'>
                            <Link href={`/plan?vehicleId=${event.vehicleId}`}>Ir para o plano</Link>
                        </Button>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground pt-8">Nenhum evento para este dia.</p>
                )}
                </CardContent>
            </div>
        </CardContent>
    </Card>
  );
}
