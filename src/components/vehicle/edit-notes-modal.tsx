'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateVehicleServiceNotes } from '@/app/actions';
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
import type { VehicleService } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditNotesModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vehicleService: VehicleService;
}

export function EditNotesModal({ isOpen, setIsOpen, vehicleService }: EditNotesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: vehicleService.notes || '',
    },
  });
  
  useEffect(() => {
    if(isOpen) {
        form.reset({ notes: vehicleService.notes || '' });
    }
  }, [isOpen, vehicleService, form])

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
        await updateVehicleServiceNotes(vehicleService.id, values.notes || '');
        toast({
            title: 'Sucesso!',
            description: `Observação atualizada.`,
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
          <DialogTitle>Editar Observação</DialogTitle>
          <DialogDescription>
            Adicione ou edite a observação para este serviço.
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
                    <Textarea {...field} rows={5} placeholder="Detalhes importantes, peças específicas, etc." />
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
