# Feitico

Aplicacao de agendamento e gestao para um salao unico, com landing page publica e painel administrativo em `/admin` (sem fluxo de superadmin).

## Stack

- React + TypeScript + Vite
- Tailwind + componentes UI baseados em Radix
- React Query para cache e sincronizacao
- Supabase (Auth, Postgres, Storage, Realtime)

## Setup

1. Instale dependencias:
   - npm install
2. Configure ambiente a partir de `.env.example`:
   - VITE_SUPABASE_PROJECT_ID
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
   - VITE_AUTH_STORAGE_KEY (opcional, default `feitico.auth.session`)
   - VITE_AUTH_SESSION_MAX_DAYS (opcional, default `15`)
   - VITE_AUTH_INACTIVITY_HOURS (opcional, default `24`)
   - VITE_ADMIN_ALLOWED_EMAILS (opcional, emails separados por virgula para restringir `/admin`)
   - SUPABASE_SERVICE_ROLE_KEY (somente backend/Vercel, nunca no cliente)
   - DATABASE_URL
   - DIRECT_URL
3. Rode o projeto:
   - npm run dev

## Vercel

- Use `.env.example` como referencia para cadastrar as variaveis do projeto na Vercel.
- Nao comite secrets reais no repositorio. Para producao, configure os valores reais diretamente no painel da Vercel.
- Variaveis com prefixo `VITE_` sao publicas no bundle do frontend. Nao use `SUPABASE_SERVICE_ROLE_KEY` com prefixo `VITE_`.

## Sessao e Tokens

- O cliente Supabase usa storage com chave dedicada (`VITE_AUTH_STORAGE_KEY`) e politica local de expiracao.
- Defaults atuais:
  - sessao maxima: `VITE_AUTH_SESSION_MAX_DAYS=15`
  - inatividade maxima: `VITE_AUTH_INACTIVITY_HOURS=24`
- Refresh token e validade real de sessao sao controlados no Supabase (`Auth -> User Sessions`); os limites no frontend controlam o storage/local UX.
- Para alinhar no servidor, configure no Supabase Dashboard (`Auth` -> `User Sessions`) o timebox de sessao e timeout de inatividade.

## Scripts

- `npm run dev`: ambiente local
- `npm run build`: build de producao
- `npm run check:supabase-ref`: valida consistencia do project ref do Supabase entre `supabase/config.toml` e `.env` ativos
- `npm run preview`: preview do build
- `npm run lint`: lint
- `npm run test`: testes (vitest)

## Arquitetura e roadmap

Consulte o documento tecnico em:

- docs/ARQUITETURA-E-ROADMAP.md

## Diretrizes

- Nao manter secrets hardcoded no codigo.
- Preferir validacao de entrada com Zod.
- Concentrar regras de negocio em camadas de dominio (services/hooks), evitando telas inchadas.
