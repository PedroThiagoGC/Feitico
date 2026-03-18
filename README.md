# Feitico

Aplicacao de agendamento e gestao de salao com landing page publica e painel administrativo.

## Stack

- React + TypeScript + Vite
- Tailwind + componentes UI baseados em Radix
- React Query para cache e sincronizacao
- Supabase (Auth, Postgres, Storage, Realtime)

## Setup

1. Instale dependencias:
	- npm install
2. Configure ambiente a partir de `.env.example`:
	- VITE_SUPABASE_URL
	- VITE_SUPABASE_PUBLISHABLE_KEY
3. Rode o projeto:
	- npm run dev

## Scripts

- `npm run dev`: ambiente local
- `npm run build`: build de producao
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
