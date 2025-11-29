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
import { PlusCircle, Edit, Trash2, Loader2, Plus } from 'lucide-react';
import type { Service, Category, CategoryID } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { deleteService, addOrUpdateService, updateServiceOrder, addOrUpdateCategory } from '@/app/actions';


const serviceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres.'),
  categoryId: z.string(),
});

const categoryFormSchema = z.object({
    name: z.string().min(3, 'O nome da categoria deve ter pelo menos 3 caracteres.'),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;


interface ServiceManagementClientProps {
  initialServices: Service[];
  categories: Category[];
}

interface SortableRowProps {
    service: Service;
    onEdit: (service: Service) => void;
    onDelete: (serviceId: string) => void;
    isDeleting: boolean;
}

const SortableRow = ({ service, onEdit, onDelete, isDeleting }: SortableRowProps) => {
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
                {service.name}
            </TableCell>
            <TableCell className="text-right">
                <div className='flex gap-2 justify-end'>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(service)} disabled={isDeleting}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(service.id)} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};


export function ServiceManagementClient({ initialServices, categories: initialCategories }: ServiceManagementClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryID>(categories[0]?.id);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      categoryId: activeCategory,
    },
  });
  
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onServiceSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
        const maxOrder = Math.max(0, ...services.filter(s => s.categoryId === values.categoryId).map(s => s.order));
        const serviceData = {
            ...values,
            order: editingService ? editingService.order : maxOrder + 1,
        };
        await addOrUpdateService(serviceData);
        
        // This is now just an optimistic update, the server action revalidates
        if (editingService) {
            setServices(services.map(s => s.id === editingService.id ? { ...s, ...values, id: s.id, categoryId: values.categoryId as CategoryID, order: s.order } : s));
            toast({ title: "Serviço Atualizado", description: `O serviço "${values.name}" foi atualizado.` });
        } else {
             // A real app would refetch or get the new item from the server action
            const tempNewService = { ...serviceData, id: `s${Date.now()}`, categoryId: values.categoryId as CategoryID};
            setServices([...services, tempNewService]);
            toast({ title: "Serviço Adicionado", description: `O serviço "${values.name}" foi adicionado.` });
        }

        closeServiceDialog();
    } catch (error) {
        console.error(error);
        toast({ title: 'Erro ao salvar serviço', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const onCategorySubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
        const newCategory = await addOrUpdateCategory(values);
        setCategories([...categories, newCategory]);
        toast({ title: "Categoria Adicionada", description: `A categoria "${values.name}" foi adicionada.` });
        
        setIsCategoryDialogOpen(false);
        categoryForm.reset();
        setActiveCategory(newCategory.id);
    } catch(error) {
        console.error(error);
        toast({ title: 'Erro ao adicionar categoria', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddNewService = (categoryId: CategoryID) => {
    setEditingService(null);
    serviceForm.reset({
      name: '',
      categoryId: categoryId,
    });
    setIsServiceDialogOpen(true);
  }
  
  const handleEditService = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
        id: service.id,
        name: service.name,
        categoryId: service.categoryId,
    });
    setIsServiceDialogOpen(true);
  }

  const closeServiceDialog = () => {
    setIsServiceDialogOpen(false);
    setEditingService(null);
    serviceForm.reset();
  }

  const handleDeleteService = async (serviceId: string) => {
    setDeletingId(serviceId);
    try {
        await deleteService(serviceId);
        setServices(currentServices => currentServices.filter(s => s.id !== serviceId));
        toast({ title: "Serviço Removido" });
    } catch (error) {
        toast({ title: "Erro ao remover serviço", variant: 'destructive' });
        console.error(error);
    } finally {
        setDeletingId(null);
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        const oldIndex = services.findIndex(item => item.id === active.id);
        const newIndex = services.findIndex(item => item.id === over?.id);
        
        const reorderedServices = arrayMove(services, oldIndex, newIndex);
        
        const updatedServicesWithOrder = reorderedServices.map((service, index) => ({
            ...service,
            order: index,
        }));
        
        setServices(updatedServicesWithOrder);
        
        try {
            await updateServiceOrder(updatedServicesWithOrder);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao reordenar serviços', variant: 'destructive' });
            // Revert optimistic update on failure
            setServices(services);
        }
    }
  };
  
  const servicesForCategory = services.filter(s => s.categoryId === activeCategory).sort((a,b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Serviços</CardTitle>
        <CardDescription>Adicione, edite, ordene ou remova os tipos de serviço para cada categoria de veículo. A frequência (KM e meses) é definida por veículo na tela principal.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryID)}>
          <div className='flex items-center gap-2 mb-4'>
            <TabsList>
                {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                ))}
            </TabsList>
             <Button variant="outline" size="sm" onClick={() => setIsCategoryDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
            </Button>
          </div>
          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id}>
              <div className="flex justify-end mb-4">
                <Button onClick={() => handleAddNewService(cat.id)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Serviço
                </Button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={servicesForCategory.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serviço</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servicesForCategory.map(service => (
                                <SortableRow 
                                    key={service.id} 
                                    service={service} 
                                    onEdit={handleEditService} 
                                    onDelete={handleDeleteService}
                                    isDeleting={deletingId === service.id}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </SortableContext>
              </DndContext>
            </TabsContent>
          ))}
        </Tabs>

         <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do serviço abaixo.
                    </DialogDescription>
                </DialogHeader>
                <Form {...serviceForm}>
                    <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                       <FormField
                        control={serviceForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome do Serviço</FormLabel>
                            <FormControl><Input {...field} placeholder="Ex: Troca de Óleo do Motor" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeServiceDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingService ? 'Salvar' : 'Adicionar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                    <DialogDescription>
                        Digite o nome da nova categoria de veículos.
                    </DialogDescription>
                </DialogHeader>
                <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                       <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome da Categoria</FormLabel>
                            <FormControl><Input {...field} placeholder="Ex: Veículos Leves" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Adicionar Categoria
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
