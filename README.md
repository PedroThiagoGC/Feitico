# Feitico Monorepo (Turborepo)

Monorepo com frontend e backend separados para deploy independente (ex.: Vercel):

- `apps/web`: frontend React + Vite
- `apps/api`: backend Node + Express

## Requisitos

- Node.js 20+
- npm 10+

## Instalar

```bash
npm install
```

## Rodar local

```bash
npm run dev
```

Comandos por app:

```bash
npm run dev:web
npm run dev:api
```

## Build

```bash
npm run build
```

## Lint e testes

```bash
npm run lint
npm run test
npm run typecheck
```

## Deploy na Vercel

Crie dois projetos no mesmo repositório:

1. Web

- Root Directory: `apps/web`
- Framework: Vite

2. API

- Root Directory: `apps/api`
- Build/Output: usar `vercel.json` da pasta `apps/api`

## Observações

- O hook de pre-commit (Husky) roda `npm run lint` no monorepo.
- Variáveis do frontend ficam em `apps/web/.env`.
- Variáveis da API ficam em `apps/api/.env`.
