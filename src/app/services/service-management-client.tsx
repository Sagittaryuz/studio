
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import type { Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres.'),
  defaultKm: z.coerce.number().min(0).optional(),
  defaultMonths: z.coerce.number().min(0).optional(),
  defaultSupplier: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceManagementClientProps {
  initialServices: Service[];
}

export function ServiceManagementClient({ initialServices }: ServiceManagementClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      defaultKm: 0,
      defaultMonths: 0,
      defaultSupplier: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    // Here you would call a server action to save the service
    console.log('Form submitted:', values);
    
    // Mocking API call
    await new Promise(res => setTimeout(res, 1000));
    
    if (editingService) {
        // Update existing service
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...values, id: s.id } : s));
        toast({ title: "Serviço Atualizado", description: `O serviço "${values.name}" foi atualizado com sucesso.` });

    } else {
        // Add new service
        const newService: Service = {
            id: `s${Date.now()}`,
            ...values,
            defaultKm: values.defaultKm || 0,
            defaultMonths: values.defaultMonths || 0,
            defaultSupplier: values.defaultSupplier || '',
        };
        setServices([...services, newService]);
        toast({ title: "Serviço Adicionado", description: `O serviço "${values.name}" foi adicionado.` });
    }

    handleCancelEdit();
    setIsSubmitting(false);
  };
  
  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
        id: service.id,
        name: service.name,
        defaultKm: service.defaultKm,
        defaultMonths: service.defaultMonths,
        defaultSupplier: service.defaultSupplier,
    });
  }

  const handleCancelEdit = () => {
    setEditingService(null);
    form.reset({ name: '', defaultKm: 0, defaultMonths: 0, defaultSupplier: '' });
  }

  const handleDelete = (serviceId: string) => {
    // Here you would call a server action to delete the service
    console.log('Deleting service:', serviceId);
    setServices(services.filter(s => s.id !== serviceId));
    toast({ title: "Serviço Removido", variant: 'destructive' });
  };


  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</CardTitle>
            <CardDescription>{editingService ? 'Modifique os detalhes do serviço.' : 'Crie um novo tipo de serviço de manutenção.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Serviço</FormLabel>
                      <FormControl><Input {...field} placeholder="Ex: Troca de Óleo do Motor" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="defaultKm"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Frequência (KM)</FormLabel>
                        <FormControl><Input type="number" {...field} placeholder="Ex: 10000" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="defaultMonths"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Frequência (Meses)</FormLabel>
                        <FormControl><Input type="number" {...field} placeholder="Ex: 12" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="defaultSupplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor Padrão</FormLabel>
                      <FormControl><Input {...field} placeholder="Ex: Oficina do Zé" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    {editingService && (
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingService ? null : <PlusCircle className="mr-2 h-4 w-4" />) }
                        {editingService ? 'Salvar Alterações' : 'Adicionar Serviço'}
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
         <Card>
            <CardHeader>
                <CardTitle>Lista de Serviços</CardTitle>
                <CardDescription>Todos os tipos de serviços de manutenção cadastrados no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Frequência (KM)</TableHead>
                            <TableHead>Frequência (Meses)</TableHead>
                            <TableHead>Fornecedor Padrão</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map(service => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.defaultKm > 0 ? service.defaultKm.toLocaleString('pt-BR') : 'N/A'}</TableCell>
                                <TableCell>{service.defaultMonths > 0 ? service.defaultMonths : 'N/A'}</TableCell>
                                <TableCell>{service.defaultSupplier || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <div className='flex gap-2 justify-end'>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
