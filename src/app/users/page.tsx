
'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { UsersClient } from "./users-client";
import { DashboardProvider, useDashboard } from "@/components/dashboard/dashboard-provider";
import { Skeleton } from "@/components/ui/skeleton";


function UsersContent() {
    const { data, isLoading } = useDashboard();
    
    if (isLoading || !data) {
        return (
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
                    <Skeleton className="h-96 w-full" />
                </div>
            </main>
        )
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
                <UsersClient initialUsers={data.appUsers} />
            </div>
        </main>
    )
}

export default function UsersPage() {
    return (
        <AppLayout>
            <DashboardProvider>
                <UsersContent />
            </DashboardProvider>
        </AppLayout>
    )
}
