'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Vehicle } from '@/lib/types';
import { updateVehicleKm } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2 } from 'lucide-react';

const formSchema = z.object({
  currentKm: z.number().min(0, 'KM deve ser um valor positivo.'),
});

interface UpdateKmFormProps {
  vehicle: Vehicle;
  disabled?: boolean;
}

export function UpdateKmForm({ vehicle, disabled }: UpdateKmFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentKm: vehicle.currentKm,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await updateVehicleKm(vehicle.id, values.currentKm);
      toast({
        title: 'Sucesso!',
        description: `Quilometragem do veículo ${vehicle.plate} atualizada.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a quilometragem.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
      <Input
        type="number"
        {...form.register('currentKm', { valueAsNumber: true })}
        className="w-32"
        disabled={disabled || isSubmitting}
      />
      <Button type="submit" size="icon" disabled={disabled || isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        <span className="sr-only">Atualizar KM</span>
      </Button>
    </form>
  );
}
