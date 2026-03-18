# 🏗️ Feitico Backend Architecture Guide

## Overview

Feitico é um monorepositório monorepo com Turborepo, contendo:

- **apps/web** - Frontend React + Vite + TypeScript
- **apps/api** - Backend NestJS + TypeScript + Supabase

## 🎯 Estrutura NestJS Backend

### Arquitetura em Camadas

```
apps/api/src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
├── app.controller.ts                # Health check & root endpoints
├── app.service.ts
├── common/                          # Shared utilities
│   ├── filters/                     # Exception handlers
│   │   └── http-exception.filter.ts
│   ├── interceptors/                # Response transformations
│   │   └── transform.interceptor.ts
│   └── types/                       # Zod schemas & enums
│       └── index.ts
├── services/                        # Business services
│   └── supabase.service.ts         # Supabase client wrapper
├── modules/                         # Feature modules (lazy-loadable)
│   ├── bookings/                   # Agendamentos
│   │   ├── bookings.module.ts
│   │   ├── bookings.controller.ts  # Routes: GET, POST, PUT, DELETE
│   │   └── bookings.service.ts     # Business logic
│   ├── professionals/              # Profissionais
│   ├── services/                   # Serviços
│   ├── gallery/                    # Galeria
│   ├── testimonials/               # Depoimentos
│   └── auth/                       # Autenticação JWT
```

### API Endpoints

Todos os endpoints retornam resposta padronizada:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    /* resposta */
  },
  "timestamp": "2026-03-18T..."
}
```

#### Bookings API (`api/v1/bookings`)

```bash
GET    /api/v1/bookings                    # Listar agendamentos
GET    /api/v1/bookings?status=confirmed   # Filtrar por status
GET    /api/v1/bookings/stats              # Estatísticas
GET    /api/v1/bookings/:id                # Detalhe
POST   /api/v1/bookings                    # Criar
PUT    /api/v1/bookings/:id                # Atualizar
PUT    /api/v1/bookings/:id/status         # Mudar status
DELETE /api/v1/bookings/:id                # Deletar
```

#### Professionals, Services, Gallery, Testimonials

Mesmo padrão CRUD como Bookings.

#### Auth API (`api/v1/auth`)

```bash
POST /api/v1/auth/login                    # Login com email/password
POST /api/v1/auth/verify                   # Verificar token JWT
```

## 🐳 Docker & Deployment

### Multi-Stage Dockerfile

```dockerfile
# Stage 0: Base            - Node.js 20
# Stage 1: Builder         - Build frontend + backend
# Stage 2: feitico-api    - Runtime container (NestJS)
# Stage 3: feitico-web    - Runtime container (Vite)
```

### Docker Compose (feitico.yaml)

```yaml
services:
  feitico-api: # Backend NestJS (port 3333)
  feitico-web: # Frontend Vite (port 3000)
```

Com suporte a **Traefik** para routing automático.

## 🚀 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)

1. **Validate Secrets** - Verifica SSH_PRIVATE_KEY, SERVER_HOST, SERVER_USER
2. **Setup SSH** - Configura autenticação
3. **Deploy to Server** - SSH para servidor e executa `deploy.sh`

```bash
# Deploy para dev (branch dev)
git push origin dev

# Deploy para prod (branch main)
git push origin main
```

### Deploy Script (deploy.sh)

```bash
./deploy.sh dev                  # Build + push para dev
./deploy.sh prod v1.0.0          # Deploy tag específica para prod
./deploy.sh dev 123abc-dev       # Rollback para tag anterior
```

**Features:**

- Auto-gera tags de imagem baseado em commit hash
- Docker BuildKit com cache persistente
- Substituição de variables de ambiente
- Suporte a registry privado (Azure Container Registry)

## 📋 Ambiente & Configuração

### .env.development

```bash
NODE_ENV=development
VITE_API_URL=http://api.yourdomain.dev/api/v1
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_KEY=...
```

### .env.production

```bash
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com/api/v1
SUPABASE_SERVICE_ROLE_KEY=...   # Para server-side
```

## 🔄 Alteração Necessária: Remover Lovable.dev

### 1. Frontend (apps/web)

Remover guard que bloqueia PWA em lovable.dev:

```tsx
// ❌ REMOVER de src/hooks/usePwaInstall.ts
if (["lovable.dev", "localhost"].includes(host)) {
  return; // Bloqueia
}
```

### 2. Remover referências à Lovable

```bash
# Procurar por "lovable" em todo o projeto
grep -r "lovable" apps/
```

### 3. Actualizar URLs da aplicação

- `public/manifest.json` - `"start_url"`
- `.env.example` - URLs hardcoded
- Supabase configs (RLS policies se necessário)

## 🧪 Validação Local

```bash
# Build completo
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Tests
npm run test

# Dev (ambos web + api em paralelo)
npm run dev
```

### Testtar Backend Localmente

```bash
cd apps/api
npm run dev

# Testa endpoints
curl http://localhost:3333/health
curl http://localhost:3333/api/v1/bookings
```

## 📦 Próximos Passos

1. **Remover Lovable.dev Guards** ✅ Lista acima
2. **Implementar Endpoints de Dados Real** - Conectar Supabase em todos os módulos
3. **Adicionar Autenticação Supabase** - Guards + JWT validation
4. **Testes E2E** - Playwright tests para API
5. **Deploy Vercel** - Configurar 2 projetos (web + api)
6. **Monitoring** - Logs, tracing, alertas

## 🔗 Referências

- [NestJS Official Docs](https://docs.nestjs.com/)
- [Turborepo Docs](https://turbo.build/repo)
- [Supabase Client](https://supabase.com/docs/reference/javascript/introduction)
