'use client';

import { useState, useMemo } from 'react';
import type { DashboardData, Vehicle, Service, Category, CorrectiveServiceRecord, VehicleService } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { addDays, format, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MultiSelect } from './multi-select';
import { ReportsTable } from './reports-table';

interface ReportsClientProps {
    initialData: DashboardData;
}

type CombinedRecord = (Omit<CorrectiveServiceRecord, 'date'> & { type: 'Corretiva', serviceName: string, date: Date }) | (Omit<VehicleService, 'lastDate'> & { type: 'Preventiva', serviceName: string, date: Date });


export function ReportsClient({ initialData }: ReportsClientProps) {
    const { vehicles, services, categories, correctiveServices, vehicleServices } = initialData;
    
    // FILTERS
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -90),
        to: new Date(),
      })
    const [includePreventive, setIncludePreventive] = useState(true);
    const [includeCorrective, setIncludeCorrective] = useState(true);
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const [isGenerating, setIsGenerating] = useState(false);

    const vehicleOptions = useMemo(() => vehicles.map(v => ({ value: v.id, label: v.plate })), [vehicles]);
    const categoryOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories]);
    const serviceOptions = useMemo(() => {
        const preventive = services.map(s => ({ value: s.id, label: s.name }));
        const corrective = [...new Set(correctiveServices.map(cs => cs.serviceName))].map(name => ({ value: name, label: name }));
        return [...preventive, ...corrective].filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);
    }, [services, correctiveServices]);


    const filteredData: CombinedRecord[] = useMemo(() => {
        let combined: CombinedRecord[] = [];
        const interval = {
            start: date?.from || new Date(0),
            end: date?.to || new Date(),
        };

        if (includePreventive) {
            const preventive = vehicleServices
                .filter(vs => vs.lastDate && isWithinInterval(vs.lastDate, interval))
                .map(vs => {
                    const service = services.find(s => s.id === vs.serviceId);
                    return { ...vs, type: 'Preventiva' as const, serviceName: service?.name || 'N/A', date: vs.lastDate };
                });
            combined.push(...preventive);
        }
        
        if (includeCorrective) {
            const corrective = correctiveServices
                .filter(cs => isWithinInterval(cs.date, interval))
                .map(cs => ({ ...cs, type: 'Corretiva' as const }));
            combined.push(...corrective);
        }
        
        // Apply filters
        let filtered = combined;

        if (selectedVehicles.length > 0) {
            filtered = filtered.filter(record => selectedVehicles.includes(record.vehicleId));
        }

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(record => {
                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                return vehicle && selectedCategories.includes(vehicle.category);
            });
        }
        
        if (selectedServices.length > 0) {
            filtered = filtered.filter(record => {
                const serviceIdentifier = record.type === 'Preventiva' ? record.serviceId : record.serviceName;
                return selectedServices.includes(serviceIdentifier);
            });
        }

        return filtered.sort((a,b) => b.date.getTime() - a.date.getTime());

    }, [date, includePreventive, includeCorrective, selectedVehicles, selectedCategories, selectedServices, vehicleServices, correctiveServices, vehicles, services, categories]);


    const handleExport = () => {
        setIsGenerating(true);
        // Basic CSV export
        const headers = ["Data", "Tipo", "Veículo", "Categoria", "Serviço", "Fornecedor", "Custo"];
        const rows = filteredData.map(record => {
            const vehicle = vehicles.find(v => v.id === record.vehicleId);
            const category = categories.find(c => c.id === vehicle?.category);
            return [
                format(record.date, 'dd/MM/yyyy'),
                record.type,
                vehicle?.plate || 'N/A',
                category?.name || 'N/A',
                record.serviceName,
                record.supplier,
                record.cost?.toFixed(2).replace('.', ',') || '0,00'
            ].join(';');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_despesas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsGenerating(false);
    };

    const totalCost = useMemo(() => filteredData.reduce((acc, record) => acc + (record.cost || 0), 0), [filteredData]);
    const averageCost = useMemo(() => filteredData.length > 0 ? totalCost / filteredData.length : 0, [totalCost, filteredData]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filtros do Relatório</CardTitle>
                    <CardDescription>Selecione os filtros para gerar o relatório de despesas.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <div className="grid gap-2">
                            <Label>Período</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: ptBR })}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y", { locale: ptBR })
                                    )
                                    ) : (
                                    <span>Escolha uma data</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="grid gap-2">
                            <Label>Tipo de Manutenção</Label>
                            <div className='flex items-center space-x-4 pt-2'>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="preventive" checked={includePreventive} onCheckedChange={(checked) => setIncludePreventive(!!checked)} />
                                    <Label htmlFor="preventive">Preventiva</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id="corrective" checked={includeCorrective} onCheckedChange={(checked) => setIncludeCorrective(!!checked)} />
                                    <Label htmlFor="corrective">Corretiva</Label>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Categorias</Label>
                             <MultiSelect options={categoryOptions} selected={selectedCategories} onChange={setSelectedCategories} placeholder="Todas as categorias" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Veículos</Label>
                            <MultiSelect options={vehicleOptions} selected={selectedVehicles} onChange={setSelectedVehicles} placeholder="Todos os veículos" />
                        </div>
                        <div className="grid gap-2 col-span-full">
                             <Label>Serviços</Label>
                             <MultiSelect options={serviceOptions} selected={selectedServices} onChange={setSelectedServices} placeholder="Todos os serviços" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Resultados</CardTitle>
                        <CardDescription>
                            {filteredData.length} registros encontrados. Custo total: {formatCurrency(totalCost)}. Custo médio: {formatCurrency(averageCost)}.
                        </CardDescription>
                    </div>
                    <Button onClick={handleExport} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Exportar CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <ReportsTable 
                        data={filteredData}
                        vehicles={vehicles}
                        categories={categories}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
