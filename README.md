# 🏛️ Feitico - Salão de Beleza Management Platform

Monorepo fullstack com arquitetura em camadas e deploy independente (Vercel + Docker).

## 📦 Estrutura

```
Feitico/
├── apps/
│   ├── web/          # React 18 + Vite + Tailwind (Frontend)
│   └── api/          # NestJS + Supabase (Backend)
├── .github/
│   └── workflows/    # CI/CD Pipeline (GitHub Actions)
├── Dockerfile        # Multi-stage Docker build
├── feitico.yaml      # Docker Compose com Traefik
├── deploy.sh         # Deployment script com Docker BuildKit
└── turbo.json        # Turborepo orchestration
```

## 🚀 Stack

### Frontend (apps/web)

- **React** 18.3 + TypeScript 5
- **Vite** 8 (build tool)
- **Tailwind CSS** + shadcn/ui (Radix components)
- **Supabase** client (Auth, Realtime, Storage)
- **React Query** + React Hook Form
- **Recharts** (dashboard)
- **Vitest** + Playwright (testing)

### Backend (apps/api)

- **NestJS** 10 + TypeScript (Enterprise framework)
- **Supabase** (database + auth)
- **Zod** (runtime validation)
- **Passport + JWT** (authentication)
- **Docker** (containerization)
- **Jest** (testing)

### DevOps & Deployment

- **Turborepo** (monorepo orchestration)
- **Docker** multi-stage build
- **GitHub Actions** (CI/CD)
- **Traefik** (reverse proxy)
- **Vercel** (preferred) or Docker Swarm

## 📋 Pré-requisitos

- Node.js 20+
- npm 10.8+ (com workspaces)
- Docker 24+ (para deploy local)
- Git

## 🛠️ Setup Local

```bash
# 1. Clone e instale
git clone https://github.com/seu-usuario/Feitico.git
cd Feitico
npm install

# 2. Configure ambiente
cp apps/web/.env.example apps/web/.env.development
cp apps/api/.env.example apps/api/.env.development

# 3. Rode local (ambos em paralelo)
npm run dev

# Frontend: http://localhost:8080
# Backend:  http://localhost:3333/health
```

## 📄 Variáveis de Ambiente

### Frontend (`apps/web/.env.development`)

```bash
VITE_API_URL=http://localhost:3333/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_public_key
```

### Backend (`apps/api/.env.development`)

```bash
NODE_ENV=development
PORT=3333
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=dev_secret_key
FRONTEND_URL=http://localhost:8080
```

## 🧪 Desenvolvimento

```bash
# Dev mode (ambos web + api com hot-reload)
npm run dev

# Build completo
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Testes
npm run test

# Frontend apenas
cd apps/web && npm run dev

# Backend apenas
cd apps/api && npm run dev
```

## 🐳 Docker & Deployment

### Build Local

```bash
docker build -t feitico-api:latest --target feitico-api .
docker build -t feitico-web:latest --target feitico-web .

docker run -p 3333:3333 feitico-api:latest
docker run -p 3000:3000 feitico-web:latest
```

### Deploy com Script

```bash
# Development
./deploy.sh dev

# Production
./deploy.sh prod

# Rollback para tag específica
./deploy.sh prod v1.0.0
```

Requer `.env.development` e `.env.production` configurados.

## 🚀 Deploy Vercel (Recomendado)

### Criar 2 Projetos

1. **Frontend** (apps/web)
   - Root Directory: `apps/web`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output: `dist`

2. **Backend** (apps/api)
   - Root Directory: `apps/api`
   - Framework: Node.js
   - Build Command: `npm run build`
   - Output: `dist`

### Variáveis de Ambiente Vercel

```bash
# Frontend Project
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...

# Backend Project
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
```

## 📚 API Endpoints

Documentação completa em [ARCHITECTURE.md](./ARCHITECTURE.md)

```bash
# Health check
GET http://localhost:3333/health

# Bookings CRUD
GET    /api/v1/bookings
POST   /api/v1/bookings
PUT    /api/v1/bookings/:id
DELETE /api/v1/bookings/:id

# Professionals, Services, Gallery, Testimonials (mesmo padrão CRUD)
```

## 🔐 Autenticação

- **Frontend**: Supabase Auth (Magic Link / OAuth)
- **Backend**: JWT + Passport
- **Database**: RLS policies no Supabase

## 📖 Documentação

- [Architecture Guide](./ARCHITECTURE.md) - Estrutura detalhada
- [Remove Lovable](./REMOVE_LOVABLE.md) - Guia de migração
- [NestJS Docs](https://docs.nestjs.com/)
- [Turborepo Docs](https://turbo.build/repo)

## 🧹 Code Quality

- **ESLint** - Linting & formatting
- **TypeScript** - Type safety
- **Prettier** - Code formatting
- **Husky** - Pre-commit hooks
- **Jest/Vitest** - Unit testing

## 🔄 CI/CD Pipeline

GitHub Actions (`.github/workflows/deploy.yml`):

1. Valida secrets (SSH_PRIVATE_KEY)
2. Setup SSH
3. Execute deploy script no servidor

```bash
git push origin main   # Deploy para prod
git push origin dev    # Deploy para dev
```

## 📊 Project Features

- ✅ Dashboard financeiro (real-time)
- ✅ CRUD Agendamentos (status transitions)
- ✅ Gerenciamento de Profissionais
- ✅ Catálogo de Serviços
- ✅ Galeria de Imagens
- ✅ Depoimentos de Clientes
- ✅ PWA (offline support)
- ✅ Responsive design
- ✅ Auto-preselection de serviço no agendamento

## ⚠️ Próximos Passos

1. Remover referências a Lovable.dev (vide [REMOVE_LOVABLE.md](./REMOVE_LOVABLE.md))
2. Configurar deploy no Vercel/Docker
3. Setup Supabase RLS policies
4. Implementar testes E2E
5. Setup monitoring & logging

## 📝 License

MIT

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

- Root Directory: `apps/web`
- Framework: Vite

2. API

- Root Directory: `apps/api`
- Build/Output: usar `vercel.json` da pasta `apps/api`

## Observações

- O hook de pre-commit (Husky) roda `npm run lint` no monorepo.
- Variáveis do frontend ficam em `apps/web/.env`.
- Variáveis da API ficam em `apps/api/.env`.
