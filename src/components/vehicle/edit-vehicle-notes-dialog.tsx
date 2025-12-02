'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateVehicleNotes } from '@/app/actions';
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
import { Textarea } from '@/components/ui/textarea';
import type { Vehicle } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditVehicleNotesDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vehicle: Vehicle;
}

export function EditVehicleNotesDialog({ isOpen, setIsOpen, vehicle }: EditVehicleNotesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: vehicle.notes || '',
    },
  });
  
  useEffect(() => {
    if(isOpen) {
        form.reset({ notes: vehicle.notes || '' });
    }
  }, [isOpen, vehicle, form])

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
        await updateVehicleNotes(vehicle.id, values.notes || '');
        toast({
            title: 'Sucesso!',
            description: `Observação do veículo ${vehicle.plate} atualizada.`,
        });
        handleClose();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível atualizar a observação.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Observação do Veículo</DialogTitle>
          <DialogDescription>
            Altere a observação para o veículo {vehicle.plate}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} placeholder="Detalhes importantes sobre o veículo, histórico, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
