# Vercel + Supabase Environment Setup

Use dois projetos na Vercel:

- `web` apontando para `apps/web`
- `api` apontando para `apps/api`

## 1) Variaveis do projeto web (apps/web)

Copie de `vercel-frontend.env.example`:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Como obter

- `VITE_API_URL`: URL publica do backend + `/api/v1`.
  - Exemplo: `https://api.seudominio.com/api/v1`
- `VITE_SUPABASE_URL`: no painel Supabase em `Settings > API > Project URL`.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: no painel Supabase em `Settings > API > anon public`.

## 2) Variaveis do projeto api (apps/api)

Copie de `vercel-backend.env.example`:

- `NODE_ENV=production`
- `FRONTEND_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` (opcional, recomendado)

### Como obter

- `FRONTEND_URL`: URL publica do frontend.
  - Exemplo: `https://app.seudominio.com`
- `JWT_SECRET`: gerar um segredo forte.
  - Linux/macOS: `openssl rand -base64 48`
  - Node: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
- `SUPABASE_URL`: `Settings > API > Project URL`.
- `SUPABASE_ANON_KEY`: `Settings > API > anon public`.
- `SUPABASE_SERVICE_ROLE_KEY`: `Settings > API > service_role`.
- `ADMIN_EMAILS`: lista separada por virgula.
  - Exemplo: `admin@seudominio.com,owner@seudominio.com`

## 3) Configurar na Vercel

1. Abra o projeto na Vercel.
2. Entre em `Settings > Environment Variables`.
3. Cole os pares `KEY=VALUE` correspondentes.
4. Repita para os ambientes `Production`, `Preview` e `Development` conforme necessario.
5. Faça redeploy.

## 4) Segurança

- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- `VITE_*` sempre vira publico no build do frontend.
- Rotacione chaves se houver vazamento.
