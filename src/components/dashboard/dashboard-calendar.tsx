'use client'

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle, Service, VehicleService } from '@/lib/types';
import { isSameDay, parseISO, format } from 'date-fns';
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
};

export function DashboardCalendar({ vehicles, services, vehicleServices }: DashboardCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const events = useMemo(() => {
    return vehicleServices
      .filter(vs => vs.nextDate < new Date('2999-01-01')) // Filter out 'infinite' dates
      .map(vs => ({
        date: vs.nextDate,
        status: vs.status,
        vehicleId: vs.vehicleId,
        serviceId: vs.serviceId,
      }));
  }, [vehicleServices]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return vehicleServices
      .filter(vs => vs.nextDate < new Date('2999-01-01') && isSameDay(vs.nextDate, selectedDate))
      .map(vs => {
        const vehicle = vehicles.find(v => v.id === vs.vehicleId);
        const service = services.find(s => s.id === vs.serviceId);
        return {
          ...vs,
          vehicle,
          service,
        };
      })
      .sort((a,b) => a.nextDate.getTime() - b.nextDate.getTime());
  }, [selectedDate, vehicleServices, vehicles, services]);

  const DayWithDot = ({ date, children }: { date: Date; children: React.ReactNode }) => {
    const dayEvents = events.filter(event => isSameDay(event.date, date));
    if (dayEvents.length === 0) return <>{children}</>;
    
    const highestPriorityStatus = dayEvents.some(e => e.status === 'VENCIDO')
      ? 'VENCIDO'
      : dayEvents.some(e => e.status === 'ALERTA')
      ? 'ALERTA'
      : 'OK';

    return (
      <div className="relative">
        {children}
        <div className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full", statusClasses[highestPriorityStatus])}></div>
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
         <CardContent className="p-0">
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-4"
                classNames={{
                    day: "h-12 w-12 text-base",
                    head_cell: "w-12",
                }}
                locale={ptBR}
                components={{
                    Day: ({ date }) => <DayWithDot date={date}>{date.getDate()}</DayWithDot>,
                }}
            />
         </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? `Manutenções para ${format(selectedDate, "PPP", { locale: ptBR })}` : 'Selecione uma data'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayEvents.length > 0 ? (
            <ul className="space-y-3">
              {selectedDayEvents.map(event => (
                <li key={event.id} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className='flex justify-between items-start'>
                     <div>
                        <p className="font-semibold text-sm">{event.service?.name}</p>
                        <p className="text-xs text-muted-foreground">{event.vehicle?.plate}</p>
                     </div>
                     <Badge className={cn("text-xs", statusClasses[event.status])}>{event.status}</Badge>
                  </div>
                  <div className="text-xs mt-2 text-muted-foreground">
                    <p>KM Próximo: {event.nextKm.toLocaleString('pt-br')} km</p>
                    <p>Responsável: {event.responsible}</p>
                  </div>
                  <Button asChild size="sm" variant="link" className='p-0 h-auto mt-2'>
                    <Link href={`/plan`}>Ir para o plano</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground pt-8">Nenhuma manutenção para este dia.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
