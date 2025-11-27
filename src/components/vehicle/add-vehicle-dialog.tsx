
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addVehicle, editVehicle } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { CategoryID, Vehicle } from '@/lib/types';

const formSchema = z.object({
  fleetNumber: z.string().optional(),
  plate: z.string().min(3, 'A placa deve ter pelo menos 3 caracteres.'),
  currentKm: z.coerce.number().min(0, 'A quilometragem não pode ser negativa.'),
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  categoryId: CategoryID;
  vehicle: Vehicle | null;
}

export function VehicleDialog({ isOpen, setIsOpen, categoryId, vehicle }: VehicleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!vehicle;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fleetNumber: '',
      plate: '',
      currentKm: 0,
    },
  });

  useEffect(() => {
    if (vehicle && isOpen) {
        form.reset({
            fleetNumber: vehicle.fleetNumber || '',
            plate: vehicle.plate,
            currentKm: vehicle.currentKm,
        });
    } else if (!vehicle && isOpen) {
        form.reset({
            fleetNumber: '',
            plate: '',
            currentKm: 0,
        });
    }
  }, [vehicle, isOpen, form]);

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
        if(isEditing && vehicle) {
            await editVehicle({ id: vehicle.id, ...values });
             toast({
                title: 'Sucesso!',
                description: `Veículo ${values.plate} atualizado.`,
            });
        } else {
            await addVehicle({ ...values, categoryId });
            toast({
                title: 'Sucesso!',
                description: `Veículo ${values.plate} adicionado.`,
            });
        }
        handleClose();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: `Não foi possível ${isEditing ? 'atualizar' : 'adicionar'} o veículo.`,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Veículo' : 'Adicionar Novo Veículo'}</DialogTitle>
          <DialogDescription>
            {isEditing 
                ? 'Atualize os dados do veículo.'
                : 'Insira os dados do novo veículo.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fleetNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº da Frota (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 152" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa / Identificação</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ABC-1234" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quilometragem Atual</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Salvar Alterações' : 'Adicionar Veículo'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    