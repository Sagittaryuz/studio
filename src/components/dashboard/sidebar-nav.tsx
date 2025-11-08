'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { JCIcon } from '@/components/icons';
import type { CategoryWithStatus, CategoryID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Car, Cog, Truck, Bike, Warehouse } from 'lucide-react';

interface SidebarNavProps {
  categories: CategoryWithStatus[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const categoryIcons: Record<CategoryID, React.ComponentType<{ className?: string }>> = {
    LOGISTICO: Truck,
    EMPILHADEIRAS: Warehouse,
    PASSEIO: Car,
    MOTOS: Bike,
    GERADORES: Cog,
};

const statusClasses: Record<string, string> = {
  VENCIDO: 'border-l-destructive',
  ALERTA: 'border-l-warning',
  OK: 'border-l-transparent',
};

const badgeStatusClasses: Record<string, string> = {
  VENCIDO: 'bg-destructive text-destructive-foreground',
  ALERTA: 'bg-warning text-warning-foreground',
};


export function SidebarNav({ categories, selectedCategory, onSelectCategory }: SidebarNavProps) {
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="hidden items-center justify-center md:flex">
         <JCIcon className="h-8 w-8 text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {categories.map((category) => {
            const Icon = categoryIcons[category.id];
            return (
            <SidebarMenuItem key={category.id}>
              <SidebarMenuButton
                onClick={() => onSelectCategory(category.id)}
                isActive={selectedCategory === category.id}
                className={cn(
                  "justify-start relative",
                  statusClasses[category.status],
                  selectedCategory !== category.id && "border-l-4",
                  selectedCategory === category.id && "border-l-4 border-l-primary"
                )}
                tooltip={{ children: category.name }}
              >
                <Icon />
                <span>{category.name}</span>
                {category.pendingCount > 0 && (
                     <Badge className={cn("absolute right-2 group-data-[collapsible=icon]:hidden", badgeStatusClasses[category.status])}>
                        {category.pendingCount}
                    </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )})}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
