'use client';
import type { Vehicle, Category, CorrectiveServiceRecord, VehicleService } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

type CombinedRecord = (Omit<CorrectiveServiceRecord, 'date'> & { type: 'Corretiva', serviceName: string, date: Date }) | (Omit<VehicleService, 'lastDate'> & { type: 'Preventiva', serviceName: string, date: Date });

interface ReportsTableProps {
  data: CombinedRecord[];
  vehicles: Vehicle[];
  categories: Category[];
}

export function ReportsTable({ data, vehicles, categories }: ReportsTableProps) {
    
    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    }
    
  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="text-right">Custo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map(record => {
              const vehicle = vehicles.find(v => v.id === record.vehicleId);
              const category = categories.find(c => c.id === vehicle?.category);
              return (
              <TableRow key={`${record.id}-${record.type}`}>
                <TableCell>{format(record.date, 'dd/MM/yyyy')}</TableCell>
                <TableCell>{record.type}</TableCell>
                <TableCell>{vehicle?.plate || 'N/A'}</TableCell>
                <TableCell>{category?.name || 'N/A'}</TableCell>
                <TableCell>{record.serviceName}</TableCell>
                <TableCell>{record.supplier}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(record.cost)}</TableCell>
              </TableRow>
            )})
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Nenhum registro encontrado para os filtros selecionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );
}
