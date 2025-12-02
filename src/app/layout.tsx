import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { AppHeader } from '@/components/layout/app-header';
import { AuthHandler } from '@/components/dev/auth-handler';


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
            <AuthHandler>
                <AppHeader />
                <main>
                    {children}
                </main>
                <Toaster />
            </AuthHandler>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
