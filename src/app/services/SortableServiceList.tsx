'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2, GripVertical } from 'lucide-react';
import type { Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateServiceOrder } from '@/app/actions';
import { useState } from 'react';

interface SortableRowProps {
    service: Service;
    onEdit: (service: Service) => void;
    onDelete: (serviceId: string) => Promise<void>;
}

const SortableRow = ({ service, onEdit, onDelete }: SortableRowProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: service.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete(service.id);
        // O estado isDeleting não precisa ser false, pois a linha será removida.
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
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

interface SortableServiceListProps {
    services: Service[];
    setServices: Dispatch<SetStateAction<Service[]>>;
    activeCategory: string;
    onEdit: (service: Service) => void;
    onDelete: (serviceId: string) => Promise<void>;
}

export function SortableServiceList({ services, setServices, activeCategory, onEdit, onDelete }: SortableServiceListProps) {
    const { toast } = useToast();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const servicesForCategory = useMemo(() => 
        services.filter(s => s.categoryId === activeCategory).sort((a, b) => a.order - b.order),
        [services, activeCategory]
    );

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

    return (
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
                                onEdit={onEdit} 
                                onDelete={onDelete}
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
    );
}
