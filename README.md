# Marmitaria da Diih - Cardápio Digital

Este projeto é um aplicativo web progressivo (PWA) construído com React, Vite e Supabase.

## Pré-requisitos

1.  Node.js instalado.
2.  Conta no Supabase.

## Configuração

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure o Supabase:**
    -   Crie um arquivo `.env` na raiz do projeto com suas credenciais (veja `.env.example`).
    -   No `.env`, adicione:
        ```env
        VITE_SUPABASE_URL=sua_url_do_supabase
        VITE_SUPABASE_ANON_KEY=sua_anon_key
        ```

3.  **Crie as tabelas no Banco de Dados (SQL Editor):**
    Execute o script SQL contido no arquivo `supabase/migrations/20240520000000_initial_schema.sql` no painel do Supabase (SQL Editor).

4.  **Configure o Storage:**
    -   Crie um bucket público chamado `images`.
    -   Adicione uma política de acesso (Policy) para permitir leitura pública e upload (para testes, permita tudo ou restrinja conforme necessário).

## Funcionalidades PWA

O aplicativo está configurado para ser instalável em dispositivos móveis.
-   Ícone na tela inicial.
-   Tela de splash.
-   Funciona offline (cache básico).

Para personalizar o ícone, adicione `pwa-192x192.png` e `pwa-512x512.png` na pasta `public/` antes de fazer o build.

## Desenvolvimento

Para rodar o projeto localmente:
```bash
npm run dev
```

Para gerar a versão de produção:
```bash
npm run build
```
teste atualização
