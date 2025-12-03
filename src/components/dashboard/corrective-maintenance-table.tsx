'use client';
import { useState } from 'react';
import type { Vehicle, CorrectiveServiceRecord } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, ShieldCheck } from 'lucide-react';
import { AddCorrectiveSheet } from './add-corrective-sheet';

interface CorrectiveMaintenanceTableProps {
  vehicle: Vehicle;
  records: CorrectiveServiceRecord[];
  canEdit: boolean;
}

export function CorrectiveMaintenanceTable({ vehicle, records, canEdit }: CorrectiveMaintenanceTableProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    }

  return (
    <div className="p-4">
        <div className="flex justify-end mb-4">
            <Button onClick={() => setIsSheetOpen(true)} disabled={!canEdit}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Reparo
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Serviço Realizado</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Garantia</TableHead>
            <TableHead>Anexos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length > 0 ? (
            records.map(record => (
              <TableRow key={record.id}>
                <TableCell>{record.date.toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{record.serviceName}</TableCell>
                <TableCell>{record.supplier}</TableCell>
                <TableCell>{formatCurrency(record.cost)}</TableCell>
                <TableCell>
                    {record.warrantyDate ? (
                        <span className='flex items-center gap-1'>
                            <ShieldCheck className='h-4 w-4 text-primary'/>
                            {record.warrantyDate.toLocaleDateString('pt-BR')}
                        </span>
                    ) : 'N/A'}
                </TableCell>
                <TableCell>
                  {record.attachments && record.attachments.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {record.attachments.map((att, index) => (
                        <Button key={index} asChild variant="link" size="sm" className="p-0 h-auto justify-start">
                          <a href={att} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            Anexo {index + 1}
                          </a>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    'Nenhum'
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Nenhum registro de manutenção corretiva para este veículo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <AddCorrectiveSheet 
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        vehicle={vehicle}
      />
    </div>
  );
}
