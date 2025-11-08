'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { suggestMaintenanceSchedule, SuggestMaintenanceScheduleOutput } from '@/app/actions';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import type { VehicleWithStatus, VehicleService, Service } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const formSchema = z.object({
  vehicleUsage: z.string().min(10, 'Descreva o uso do veículo com mais detalhes.'),
});

interface AiSuggestionModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vehicle: VehicleWithStatus;
  serviceHistory: VehicleService[];
  allServices: Service[];
}

export function AiSuggestionModal({
  isOpen,
  setIsOpen,
  vehicle,
  serviceHistory,
  allServices,
}: AiSuggestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<SuggestMaintenanceScheduleOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleUsage: '',
    },
  });

  const generateContext = () => {
    const serviceHistoryText = serviceHistory.map(vs => {
        const serviceName = allServices.find(s => s.id === vs.serviceId)?.name;
        return `- ${serviceName} em ${vs.lastDate.toLocaleDateString('pt-BR')} com ${vs.lastKm} km.`;
    }).join('\n');

    const serviceParametersText = allServices.map(s => {
        return `- ${s.name}: ${s.defaultKm} km / ${s.defaultMonths} meses.`;
    }).join('\n');

    return {
        serviceHistory: serviceHistoryText || "Nenhum histórico de serviço.",
        serviceParameters: serviceParametersText,
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAiResponse(null);
    try {
        const context = generateContext();
        const response = await suggestMaintenanceSchedule({
            vehicleUsage: values.vehicleUsage,
            serviceHistory: context.serviceHistory,
            serviceParameters: context.serviceParameters,
        });
        setAiResponse(response);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro de IA',
        description: 'Não foi possível gerar a sugestão.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleClose = () => {
    setIsOpen(false);
    setAiResponse(null);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugestão de Manutenção com IA
          </DialogTitle>
          <DialogDescription>
            Receba uma sugestão de plano de manutenção otimizado para o veículo {vehicle.plate}, com base no seu uso.
          </DialogDescription>
        </DialogHeader>
        
        {!aiResponse ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="vehicleUsage"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Padrões de Uso do Veículo</FormLabel>
                    <FormControl>
                        <Textarea
                        {...field}
                        rows={5}
                        placeholder="Ex: Roda principalmente em estradas pavimentadas, 300 km por dia, transportando cargas leves. Ocasionalmente enfrenta estradas de terra."
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Gerar Sugestão
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>Plano de Manutenção Sugerido</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap font-mono text-sm">
                        {aiResponse.suggestedSchedule}
                    </AlertDescription>
                </Alert>
                <Alert variant="default">
                    <AlertTitle>Justificativa</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap text-sm">
                        {aiResponse.rationale}
                    </AlertDescription>
                </Alert>
                <DialogFooter>
                    <Button onClick={handleClose}>Fechar</Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
