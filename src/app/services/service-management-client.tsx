'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';

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
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, Plus } from 'lucide-react';
import type { Service, Category, CategoryID } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { deleteService, addOrUpdateService, addOrUpdateCategory, deleteCategory } from '@/app/actions';
import { cn } from '@/lib/utils';
import type { DragEndEvent } from '@dnd-kit/core';

// Carregamento dinâmico dos componentes de ordenação para evitar erros de hidratação
const SortableCategoryList = dynamic(() => import('./SortableCategoryList').then(mod => mod.SortableCategoryList), { ssr: false });
const SortableServiceList = dynamic(() => import('./SortableServiceList').then(mod => mod.SortableServiceList), { ssr: false });


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

export function ServiceManagementClient({ initialServices, categories: initialCategories }: ServiceManagementClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Service Dialog
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  
  // Category Dialogs
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<CategoryID>(categories[0]?.id);
  const { toast } = useToast();

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
            // Em um app real, o novo serviço deveria ser retornado pela action para ter o ID correto
            // Por simplicidade, vamos adicionar um temporário e revalidar
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
    try {
        await deleteService(serviceId);
        setServices(currentServices => currentServices.filter(s => s.id !== serviceId));
        toast({ title: "Serviço Removido" });
    } catch (error) {
        toast({ title: "Erro ao remover serviço", variant: 'destructive' });
        console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Serviços e Categorias</CardTitle>
        <CardDescription>Adicione, edite, ordene ou remova os tipos de serviço e as categorias de veículos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryID)} className='flex flex-col md:flex-row gap-6'>
          <div className='flex flex-col gap-2 border-r-0 md:border-r pr-0 md:pr-6 w-full md:w-64'>
             <TabsList className="flex-col h-auto items-stretch gap-1">
                <SortableCategoryList
                    categories={categories}
                    setCategories={setCategories}
                    onEdit={handleEditCategory}
                    onDelete={setDeletingCategory}
                />
             </TabsList>

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
                <SortableServiceList
                    services={services}
                    setServices={setServices}
                    activeCategory={activeCategory}
                    onEdit={handleEditService}
                    onDelete={handleDeleteService}
                />
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