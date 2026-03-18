# Guia de Deploy Vercel - Feitico Salon

Este documento descreve o processo completo para fazer deploy da aplicação no Vercel.

## Arquitetura de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                        │
├──────────────────────────────────┬──────────────────────────┤
│   apps/web (Frontend)            │   apps/api (Backend)     │
│   ┌──────────────────────────┐   │   ┌──────────────────┐   │
│   │ React SPA (Vite)         │   │   │ NestJS API       │   │
│   │ Output: dist/            │   │   │ Output: dist/    │   │
│   │ Build: npm run build     │   │   │ Build: npm build │   │
│   └──────────────────────────┘   │   └──────────────────┘   │
│   https://feitico-salon.vercel.app   https://api-feitico-salon.vercel.app  │
└──────────────────────────────────┴──────────────────────────┘
                    ↓ (API calls)
            ┌───────────────────────┐
            │  Supabase Cloud       │
            │  (PostgreSQL + Auth)  │
            └───────────────────────┘
```

## Pré-requisitos

1. ✅ Conta GitHub com repositório Feitico criado
2. ✅ Turborepo monorepo estruturado (apps/web, apps/api, packages/*)
3. ✅ Arquivos `vercel.json` configurados em ambas as pastas
4. ✅ Credenciais Supabase para ambiente produção
5. ✅ Node.js 18+ instalado localmente

## Setup Vercel CLI (Local Testing)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy de teste (sem publish)
vercel

# Deploy para staging
vercel --prod --target staging
```

## Configuração Frontend (apps/web)

### Passo 1: Conectar ao Vercel

```bash
cd apps/web

# Opção A: Via Dashboard (recomendado para primeira vez)
# 1. Acesse https://vercel.com/dashboard
# 2. Clique "Add New Project"
# 3. Selecione seu repositório GitHub "feitico"
# 4. Configure:
#    - Framework: Vite
#    - Root Directory: apps/web
#    - Build Command: npm run build
#    - Output Directory: dist
#    - Install Command: npm install

# Opção B: Via CLI
vercel --prod
# Siga os prompts para criar novo projeto
```

### Passo 2: Configurar Variáveis de Ambiente

No dashboard Vercel (apps/web project settings → Environment Variables):

```env
# Production
VITE_API_URL=https://api-feitico-salon.vercel.app/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_KEY=your_production_anon_key

# Preview/Development
VITE_API_URL=https://api-feitico-salon.vercel.app/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_KEY=your_production_anon_key
```

**Obter valores Supabase:**
```bash
# No seu projeto Supabase:
# Settings → API
# - URL: Project URL
# - Key: Anon public key (seguro expor no browser)
```

### Passo 3: Deploy Automático

Uma vez configurado, cada push para `main` fará deploy automático:

```bash
git add .
git commit -m "feat: setup vercel deployment"
git push origin main
# Deploy automático inicia no Vercel dashboard
```

## Configuração Backend (apps/api)

### Passo 1: Conectar ao Vercel

```bash
cd apps/api

# Via Dashboard:
# 1. https://vercel.com/dashboard → "Add New Project"
# 2. Selecione repositório feitico
# 3. Configure:
#    - Framework: Other (Node.js)
#    - Root Directory: apps/api
#    - Build Command: npm run build
#    - Output Directory: dist
#    - Install Command: npm install
```

### Passo 2: Configurar Environment Variables (CRÍTICO!)

No dashboard Vercel (apps/api project settings → Environment Variables):

**Production Environment:**
```env
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# JWT Authentication
JWT_SECRET=your_secure_production_jwt_secret_min_32_chars

# CORS
CORS_ORIGIN=https://feitico-salon.vercel.app

# Optional: Logging
LOG_LEVEL=info
```

**Preview Environment (staging):**
```env
NODE_ENV=production
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_secure_production_jwt_secret_min_32_chars
CORS_ORIGIN=https://preview-*.vercel.app
```

⚠️ **SEGURANÇA:** 
- Nunca commit `JWT_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY`
- Use Vercel Secrets (não plain text)
- Gire JWT_SECRET se um preview URL vazar
- SERVICE_ROLE_KEY = permissão total no Supabase, proteja bem!

### Passo 3: Deploy Automático

```bash
git add .
git commit -m "feat: setup vercel backend deployment"
git push origin main
```

## Verificação Pós-Deploy

### Testar Frontend
```bash
# Via navegador
curl https://feitico-salon.vercel.app

# Verificar API URL está correto
open https://feitico-salon.vercel.app
# DevTools → Console → check VITE_API_URL valor
```

### Testar Backend
```bash
# Health check
curl https://api-feitico-salon.vercel.app/health

# Expected response:
# {"status":"ok"}

# Teste com dados
curl https://api-feitico-salon.vercel.app/api/v1/professionals

# Se retornar dados: ✅ Backend funciona
# Se retornar erro: ❌ check logs no Vercel dashboard
```

### Testar Conexão Frontend → Backend
```bash
# Abrir DevTools da aplicação
# Fazer login ou navegar para página que chama API
# Network tab → procure requests para api-feitico-salon.vercel.app

# Expected:
# ✅ 200 status para /api/v1/*
# ✅ Authorization header com Bearer token
# ✅ Application/json responses
```

## Troubleshooting

### Erro 502 ou 503 no Backend

**Causa:** Supabase keys inválidas ou não configuradas
```bash
# Solução:
1. Dashboard Vercel → apps/api → Settings → Environment Variables
2. Verificar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
3. Se modificou, redeploy: "Redeploy" button no Vercel
4. Aguarde 30-60 segundos
5. Teste novamente: curl https://api-feitico-salon.vercel.app/health
```

### CORS Errors no Frontend

**Erro:** "Access to XMLHttpRequest... blocked by CORS policy"
```bash
# Solução:
1. Backend apps/api/src/main.ts verificar:
   app.enableCors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
     credentials: true,
   });
2. Vercel environment variable CORS_ORIGIN = seu frontend URL
3. Redeploy backend
```

### Teste local antes de push

```bash
# Terminal 1: Backend
cd apps/api
npm run dev

# Terminal 2: Frontend
cd apps/web
VITE_API_URL=http://localhost:3333/api/v1 npm run dev

# Teste na aplicação: http://localhost:5173
# Network tab deveria mostrar requests para localhost:3333
```

## CI/CD Automático via GitHub Actions

Já configurado em `.github/workflows/deploy.yml`:
- Cada push para `main` → build testado
- Se testes passarem → deploy automático no Vercel
- Se testes falharem → deploy bloqueado

Ver logs:
```bash
# GitHub → Actions → Workflow runs
# ou: https://github.com/seu-usuario/feitico/actions
```

## Rollback em Produção

Se deploy quebrou produção:

```bash
# Opção 1: Via Vercel Dashboard
1. https://vercel.com/seu-usuario/feitico-salon
2. Deployments tab
3. Clique em deployment anterior
4. Clique "Promote to Production"

# Opção 2: Reverter no Git
git revert HEAD
git push origin main
# Novo build automático com código anterior
```

## Monitoramento Contínuo

### Logs em Tempo Real
```bash
vercel logs [project-name] --follow

# ou via dashboard:
# Vercel → Project → Logs tab
```

### Analytics e Performance
- Vercel Dashboard → Analytics tab
- Veja: FCP, LCP, CLS, Requests/min, Errors
- Alerte se Error Rate > 1%

### Supabase Logs
- Supabase Dashboard → Logs
- Monitore queries lentas
- Alerte se rate limit atingido

## Escalação Futura

Quando precisar de mais recursos:

```bash
# Upgrade para Vercel Pro
# - Deploy concorrentes ilimitados
# - Mais compute resources
# - Observability avançada

# Ou scale backend via:
# - Vercel Enterprise (dedicado)
# - Docker + Cloud Run, ECS, Kubernetes
# - Serverless: AWS Lambda, GCP Cloud Functions
```

## Checklist Final

Antes de considerar "Ready for Production":

- [ ] Frontend deploy com VITE_API_URL correto
- [ ] Backend deploy com todas as env vars
- [ ] Health check retorna 200
- [ ] API test retorna dados reais do Supabase
- [ ] Frontend conecta ao backend sem CORS errors
- [ ] Testes locais passam em `npm run test`
- [ ] Build sem warnings: `npm run build`
- [ ] JWT login/logout funciona
- [ ] Bookings podem ser criadas via UI
- [ ] Admin painel carrega dados reais
- [ ] Rollback testado (conhecer como reverter)

## Contatos e Recursos

- **Vercel Docs:** https://vercel.com/docs
- **NestJS Vercel Deploy:** https://nestjs.com/deployment
- **Supabase Connection:** https://supabase.com/docs
- **GitHub Actions:** https://github.com/features/actions
