'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Trash2, Loader2, GripVertical } from 'lucide-react';
import type { Service, Category, CategoryID } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres.'),
  categoryId: z.string(),
  defaultKm: z.coerce.number().min(0).optional(),
  defaultMonths: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceManagementClientProps {
  initialServices: Service[];
  categories: Category[];
}

interface SortableRowProps {
    service: Service;
    onEdit: (service: Service) => void;
    onDelete: (serviceId: string) => void;
}

const SortableRow = ({ service, onEdit, onDelete }: SortableRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: service.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            <TableCell className="font-medium cursor-grab" {...listeners}>
              <div className='flex items-center gap-2'>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {service.name}
              </div>
            </TableCell>
            <TableCell>{service.defaultKm > 0 ? service.defaultKm.toLocaleString('pt-BR') : 'N/A'}</TableCell>
            <TableCell>{service.defaultMonths > 0 ? service.defaultMonths : 'N/A'}</TableCell>
            <TableCell className="text-right">
                <div className='flex gap-2 justify-end'>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(service.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};


export function ServiceManagementClient({ initialServices, categories }: ServiceManagementClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryID>(categories[0]?.id);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: activeCategory,
      defaultKm: 0,
      defaultMonths: 0,
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
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...values, id: s.id, categoryId: values.categoryId as CategoryID, order: s.order } : s));
        toast({ title: "Serviço Atualizado", description: `O serviço "${values.name}" foi atualizado com sucesso.` });

    } else {
        // Add new service
        const maxOrder = Math.max(0, ...services.filter(s => s.categoryId === values.categoryId).map(s => s.order));
        const newService: Service = {
            id: `s${Date.now()}`,
            ...values,
            categoryId: values.categoryId as CategoryID,
            defaultKm: values.defaultKm || 0,
            defaultMonths: values.defaultMonths || 0,
            order: maxOrder + 1,
        };
        setServices([...services, newService]);
        toast({ title: "Serviço Adicionado", description: `O serviço "${values.name}" foi adicionado.` });
    }

    closeDialog();
    setIsSubmitting(false);
  };

  const handleAddNew = (categoryId: CategoryID) => {
    setEditingService(null);
    form.reset({
      name: '',
      categoryId: categoryId,
      defaultKm: 0,
      defaultMonths: 0,
    });
    setIsDialogOpen(true);
  }
  
  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
        id: service.id,
        name: service.name,
        categoryId: service.categoryId,
        defaultKm: service.defaultKm,
        defaultMonths: service.defaultMonths,
    });
    setIsDialogOpen(true);
  }

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    form.reset();
  }

  const handleDelete = (serviceId: string) => {
    // Here you would call a server action to delete the service
    console.log('Deleting service:', serviceId);
    setServices(services.filter(s => s.id !== serviceId));
    toast({ title: "Serviço Removido", variant: 'destructive' });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        setServices((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over?.id);
            const newArray = arrayMove(items, oldIndex, newIndex);
            // Update order property after moving
            return newArray.map((item, index) => ({ ...item, order: index }));
        });
    }
  };
  
  const servicesForCategory = services.filter(s => s.categoryId === activeCategory).sort((a,b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Serviços</CardTitle>
        <CardDescription>Adicione, edite ou remova os tipos de serviço para cada categoria de veículo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryID)}>
          <TabsList>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id}>
              <div className="flex justify-end mb-4">
                <Button onClick={() => handleAddNew(cat.id)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Serviço
                </Button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={servicesForCategory.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Frequência (KM)</TableHead>
                                <TableHead>Frequência (Meses)</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servicesForCategory.map(service => (
                                <SortableRow key={service.id} service={service} onEdit={handleEdit} onDelete={handleDelete} />
                            ))}
                        </TableBody>
                    </Table>
                </SortableContext>
              </DndContext>
            </TabsContent>
          ))}
        </Tabs>

         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do serviço abaixo.
                    </DialogDescription>
                </DialogHeader>
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
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingService ? 'Salvar' : 'Adicionar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
