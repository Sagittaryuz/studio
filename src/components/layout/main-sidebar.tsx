'use client';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { JCIcon } from '@/components/icons';
import { LayoutDashboard, Wrench, Settings } from 'lucide-react';
import Link from 'next/link';

export function MainSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { href: '/', label: 'Início', icon: LayoutDashboard },
        { href: '/plan', label: 'Plano de Manutenção', icon: Wrench },
        { href: '/services', label: 'Gerenciar Serviços', icon: Settings },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="hidden items-center justify-center md:flex">
                <Link href="/">
                    <JCIcon className="h-8 w-8 text-sidebar-foreground" />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={{ children: item.label, side: 'right' }}
                                >
                                    <div>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </div>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {/* Footer content if any */}
            </SidebarFooter>
        </Sidebar>
    );
}
