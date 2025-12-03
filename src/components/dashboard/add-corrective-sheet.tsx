'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addCorrectiveService } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Vehicle } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  serviceName: z.string().min(1, "Selecione um serviço."),
  date: z.date({ required_error: 'Selecione a data.' }),
  cost: z.coerce.number().min(0, 'O custo não pode ser negativo.'),
  supplier: z.string().min(1, 'Fornecedor é obrigatório.'),
  notes: z.string().optional(),
  attachments: z.custom<FileList>().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const correctiveServiceOptions = [
    "Pintura e Funilaria",
    "Troca de Pneu (furo/rasgo)",
    "Reparo de Motor",
    "Sistema de Freios",
    "Sistema de Suspensão",
    "Sistema Elétrico",
    "Ar Condicionado",
    "Troca de Vidro/Para-brisa",
    "Outro (especificar nas notas)",
];


interface AddCorrectiveSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vehicle: Vehicle;
}

export function AddCorrectiveSheet({ isOpen, setIsOpen, vehicle }: AddCorrectiveSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const storage = useStorage();


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: '',
      cost: 0,
      supplier: '',
      notes: '',
    },
  });

  const uploadFile = (file: File, vehicleId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `corrective-attachments/${vehicleId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload Error:", error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setUploadProgress(null);
    try {
        let attachmentUrls: string[] = [];
        if (values.attachments && values.attachments.length > 0) {
            const files = Array.from(values.attachments);
            const uploadPromises = files.map(file => uploadFile(file, vehicle.id));
            attachmentUrls = await Promise.all(uploadPromises);
            setUploadProgress(null);
        }

        await addCorrectiveService({ 
            ...values, 
            vehicleId: vehicle.id,
            attachments: attachmentUrls,
        });
        toast({
            title: 'Sucesso!',
            description: 'Novo reparo corretivo adicionado.',
        });
        setIsOpen(false);
        form.reset();
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível adicionar o registro de reparo.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Registrar Reparo Corretivo - {vehicle.plate}</SheetTitle>
          <SheetDescription>
            Adicione um novo registro de reparo realizado para este veículo.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Serviço Realizado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {correctiveServiceOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className='mb-1'>Data do Serviço</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Detalhes do reparo, peças trocadas, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anexos (NF, Imagens)</FormLabel>
                  <FormControl>
                    <Input type="file" multiple {...form.register('attachments')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {uploadProgress !== null && (
                <div className="space-y-1">
                    <p className="text-sm">Enviando arquivos... {Math.round(uploadProgress)}%</p>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
            )}
             <SheetFooter className="pt-4">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Reparo
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
