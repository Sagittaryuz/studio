import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import Link from 'next/link';
import { LayoutDashboard, Cog } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Plano de Manutenção de Frota',
  description: 'Gestão de Manutenções Preventivas de Frotas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased'
        )}
      >
        <FirebaseClientProvider>
           <SidebarProvider>
            <AppHeader>
                <SidebarTrigger />
            </AppHeader>
            <div className="flex min-h-[calc(100vh-3rem)]">
                <Sidebar>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip={{children: 'Painel'}}>
                                    <Link href="/">
                                        <LayoutDashboard />
                                        <span>Painel</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip={{children: 'Gerenciar Serviços'}}>
                                    <Link href="/services">
                                        <Cog />
                                        <span>Gerenciar Serviços</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
            </div>
            <Toaster />
           </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
