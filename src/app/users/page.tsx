import { AppLayout } from "@/components/layout/app-layout";
import { getDashboardData } from "@/lib/data";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
    // We fetch all data, which includes users
    const data = await getDashboardData('admin');

    return (
        <AppLayout>
             <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h1>
                    <UsersClient initialUsers={data.appUsers} />
                </div>
            </main>
        </AppLayout>
    )
}
