# Nosso Treino

Aplicativo web instalável para acompanhar a sequência A-C-B-D, séries, descanso, histórico e presença opcional na Daytona CT.

## Como funciona

- A conta e os treinos ficam salvos somente no aparelho.
- Não há sincronização entre celulares nesta versão.
- O backup pode ser baixado e restaurado pela Central de Controle.
- A localização é opcional e não é enviada para um servidor.

## Rodar localmente

Sirva esta pasta com qualquer servidor HTTP. O aplicativo usa caminhos a partir da raiz e precisa de HTTPS em produção para localização e instalação.

## Publicar no Vercel

Há duas configurações válidas:

1. Projeto apontando para a raiz do repositório: usa `/vercel.json`.
2. Projeto com Root Directory `nosso-treino`: usa `/nosso-treino/vercel.json`.

As duas executam `build.mjs` e publicam apenas os sete arquivos necessários da pasta `dist`.
