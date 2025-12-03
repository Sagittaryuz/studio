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
import { LayoutDashboard, Wrench, Settings, ClipboardList, User, Shield, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/firebase'; // Using the specific user hook

// This should come from a context or a hook after fetching from Firestore
const MOCK_USER_ROLE = 'admin'; // 'admin', 'master', or 'driver'

const allMenuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MASTER'] },
    { href: '/plan', label: 'Plano de Manutenção', icon: Wrench, roles: ['ADMIN', 'MASTER'] },
    { href: '/reports', label: 'Relatórios', icon: ClipboardList, roles: ['ADMIN', 'MASTER'] },
    { href: '/checklist', label: 'Checklist', icon: ClipboardList, roles: ['DRIVER'] },
    { href: '/authorizations', label: 'Autorizações', icon: Shield, roles: ['ADMIN', 'MASTER'] },
    { href: '/users', label: 'Usuários', icon: Users, roles: ['ADMIN', 'MASTER'] },
    { href: '/services', label: 'Gerenciar Serviços', icon: Settings, roles: ['ADMIN', 'MASTER'] },
];

export function MainSidebar() {
    const pathname = usePathname();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser(); // Using the hook to get user info

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({ title: "Você saiu." });
            router.push('/login');
        } catch (error) {
            toast({ title: "Erro ao sair", variant: 'destructive' });
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    const availableMenuItems = allMenuItems.filter(item => item.roles.includes(MOCK_USER_ROLE.toUpperCase()));


    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="hidden items-center justify-center md:flex">
                <Link href="/">
                    <JCIcon className="h-8 w-8 text-sidebar-foreground" />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {availableMenuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <button className="flex items-center gap-2 w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
                        <Avatar className='h-8 w-8'>
                            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-col text-left hidden group-data-[collapsible=icon]:hidden">
                            <p className="text-sm font-semibold truncate">{user?.displayName || "Usuário"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                   </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className='mb-2'>
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Perfil</span>
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
