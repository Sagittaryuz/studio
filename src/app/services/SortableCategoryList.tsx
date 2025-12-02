'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2 } from 'lucide-react';
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateCategoryOrder } from '@/app/actions';

interface SortableCategoryTabProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const SortableCategoryTab = ({ category, onEdit, onDelete }: SortableCategoryTabProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
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
    );
};

interface SortableCategoryListProps {
    categories: Category[];
    setCategories: Dispatch<SetStateAction<Category[]>>;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

export function SortableCategoryList({ categories, setCategories, onEdit, onDelete }: SortableCategoryListProps) {
    const { toast } = useToast();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {categories.map(cat => (
                    <SortableCategoryTab 
                        key={cat.id} 
                        category={cat}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}