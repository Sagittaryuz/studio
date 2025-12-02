'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Trash2, Loader2, Plus, GripVertical } from 'lucide-react';
import type { Service, Category, CategoryID } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { deleteService, addOrUpdateService, updateServiceOrder, addOrUpdateCategory, updateCategoryOrder, deleteCategory } from '@/app/actions';
import { cn } from '@/lib/utils';


const serviceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres.'),
  categoryId: z.string(),
});

const categoryFormSchema = z.object({
    id: z.string().optional(),
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
                <GripVertical className="inline-block mr-2 h-4 w-4 text-muted-foreground" />
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

interface SortableCategoryTabProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const SortableCategoryTab = ({ category, onEdit, onDelete }: SortableCategoryTabProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
         <div ref={setNodeRef} style={style} className='relative group' {...attributes} {...listeners}>
            <TabsTrigger value={category.id} className='w-full pr-12'>
                {category.name}
            </TabsTrigger>
             <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-muted p-0.5 rounded-md">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(category);}}>
                    <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(category); }}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}


export function ServiceManagementClient({ initialServices, categories: initialCategories }: ServiceManagementClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [categories, setCategories] = useState<Category[]>(initialCategories.sort((a,b) => a.order - b.order));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Service Dialog
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  
  // Category Dialogs
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
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
      id: undefined,
      name: '',
    },
  });

  const onServiceSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
        const maxOrder = Math.max(0, ...services.filter(s => s.categoryId === values.categoryId).map(s => s.order || 0));
        const serviceData = {
            ...values,
            order: editingService ? editingService.order : maxOrder + 1,
        };
        await addOrUpdateService(serviceData);
        
        if (editingService) {
            setServices(services.map(s => s.id === editingService.id ? { ...s, ...values, id: s.id, categoryId: values.categoryId as CategoryID, order: s.order } : s));
            toast({ title: "Serviço Atualizado", description: `O serviço "${values.name}" foi atualizado.` });
        } else {
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
        const newOrUpdatedCategory = await addOrUpdateCategory(values);
        if (editingCategory) {
            setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: values.name } : c));
            toast({ title: "Categoria Atualizada" });
        } else {
            setCategories([...categories, newOrUpdatedCategory]);
            toast({ title: "Categoria Adicionada" });
            setActiveCategory(newOrUpdatedCategory.id);
        }
        
        closeCategoryDialog();
    } catch(error) {
        console.error(error);
        toast({ title: 'Erro ao salvar categoria', variant: 'destructive' });
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
  
  const handleAddNewCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
        id: undefined,
        name: '',
    });
    setIsCategoryDialogOpen(true);
  }
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
        id: category.id,
        name: category.name
    });
    setIsCategoryDialogOpen(true);
  }
  
  const handleDeleteCategoryConfirm = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
        await deleteCategory(deletingCategory.id);
        setCategories(cats => cats.filter(c => c.id !== deletingCategory.id));
        setServices(srvs => srvs.filter(s => s.categoryId !== deletingCategory.id));
        toast({ title: "Categoria Removida" });
        if (activeCategory === deletingCategory.id) {
            setActiveCategory(categories[0]?.id);
        }
    } catch (error) {
        toast({ title: "Erro ao remover categoria", variant: 'destructive' });
        console.error(error);
    } finally {
        setIsSubmitting(false);
        setDeletingCategory(null);
    }
  }


  const closeServiceDialog = () => {
    setIsServiceDialogOpen(false);
    setEditingService(null);
    serviceForm.reset();
  }
  
  const closeCategoryDialog = () => {
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
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
  
  const handleServiceDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = services.findIndex(item => item.id === active.id);
        const newIndex = services.findIndex(item => item.id === over.id);
        
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
            setServices(services); // Revert on failure
        }
    }
  };
  
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = categories.findIndex(c => c.id === active.id);
        const newIndex = categories.findIndex(c => c.id === over.id);
        
        const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(reorderedCategories);
        
        try {
            await updateCategoryOrder(reorderedCategories);
        } catch(error) {
            console.error(error);
            toast({ title: 'Erro ao reordenar categorias', variant: 'destructive' });
            setCategories(categories); // Revert
        }
    }
  }
  
  const servicesForCategory = services.filter(s => s.categoryId === activeCategory).sort((a,b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Serviços e Categorias</CardTitle>
        <CardDescription>Adicione, edite, ordene ou remova os tipos de serviço e as categorias de veículos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryID)} className='flex flex-col md:flex-row gap-6'>
          <div className='flex flex-col gap-2 border-r-0 md:border-r pr-0 md:pr-6 w-full md:w-64'>
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <TabsList className="flex-col h-auto items-stretch gap-1">
                        {categories.map(cat => (
                            <SortableCategoryTab 
                                key={cat.id} 
                                category={cat}
                                onEdit={handleEditCategory}
                                onDelete={setDeletingCategory}
                             />
                        ))}
                    </TabsList>
                </SortableContext>
             </DndContext>

             <Button variant="outline" size="sm" onClick={handleAddNewCategory} className='mt-2'>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
            </Button>
          </div>
          <div className="flex-1">
            {categories.map(cat => (
                <TabsContent key={cat.id} value={cat.id} className='mt-0'>
                <div className="flex justify-end mb-4">
                    <Button onClick={() => handleAddNewService(cat.id)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Serviço em {cat.name}
                    </Button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleServiceDragEnd}>
                    <SortableContext items={servicesForCategory.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead className="text-right w-24">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servicesForCategory.length > 0 ? servicesForCategory.map(service => (
                                    <SortableRow 
                                        key={service.id} 
                                        service={service} 
                                        onEdit={handleEditService} 
                                        onDelete={handleDeleteService}
                                        isDeleting={deletingId === service.id}
                                    />
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                            Nenhum serviço nesta categoria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </SortableContext>
                </DndContext>
                </TabsContent>
            ))}
          </div>
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
        
        <Dialog open={isCategoryDialogOpen} onOpenChange={closeCategoryDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</DialogTitle>
                    <DialogDescription>
                       {editingCategory ? 'Altere o nome da categoria.' : 'Digite o nome da nova categoria de veículos.'}
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
                            <Button type="button" variant="outline" onClick={closeCategoryDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingCategory ? 'Salvar Alterações' : 'Adicionar Categoria'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
         <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Isso excluirá permanentemente a categoria "{deletingCategory?.name}" e **todos os serviços associados a ela**. Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingCategory(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCategoryConfirm} className={cn(buttonVariants({variant: "destructive"}))} disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


      </CardContent>
    </Card>
  );
}
