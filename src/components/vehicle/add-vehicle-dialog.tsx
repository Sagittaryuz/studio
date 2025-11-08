
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addVehicle } from '@/app/actions';
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
import type { CategoryID } from '@/lib/types';

const formSchema = z.object({
  plate: z.string().min(3, 'A placa deve ter pelo menos 3 caracteres.'),
  currentKm: z.coerce.number().min(0, 'A quilometragem não pode ser negativa.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  categoryId: CategoryID;
}

export function AddVehicleDialog({ isOpen, setIsOpen, categoryId }: AddVehicleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plate: '',
      currentKm: 0,
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
        await addVehicle({ ...values, categoryId });
        toast({
            title: 'Sucesso!',
            description: `Veículo ${values.plate} adicionado.`,
        });
        handleClose();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível adicionar o veículo.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Veículo</DialogTitle>
          <DialogDescription>
            Insira a placa e a quilometragem atual do novo veículo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa</FormLabel>
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
                    Adicionar Veículo
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

