import { AppLayout } from "@/components/layout/app-layout";

export default function ChecklistPage() {
    return (
        <AppLayout>
             <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Checklist Diário</h1>
                    <p>Selecione um veículo para iniciar o checklist.</p>
                    {/* O conteúdo principal será implementado em um componente cliente. */}
                </div>
            </main>
        </AppLayout>
    )
}
