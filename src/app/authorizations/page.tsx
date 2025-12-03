import { AppLayout } from "@/components/layout/app-layout";

export default function AuthorizationsPage() {
    return (
        <AppLayout>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Autorizações de Veículos</h1>
                    <p>Aqui você poderá definir quais motoristas podem dirigir quais veículos.</p>
                    {/* O conteúdo principal será implementado em um componente cliente. */}
                </div>
            </main>
        </AppLayout>
    )
}
