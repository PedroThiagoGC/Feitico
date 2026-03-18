# Setup Local Development - Guia Rápido

Instruções para configurar e executar o projeto Feitico localmente.

## Pré-requisitos

Certifique-se de ter instalado:

- ✅ macOS/Linux/Windows com WSL2
- ✅ Node.js 18.x ou superior (`node --version`)
- ✅ npm 9.x ou superior (`npm --version`)
- ✅ Git (`git --version`)
- ✅ Uma conta Supabase ativa com projeto criado

## Estrutura do Projeto

```
feitico/
├── apps/
│   ├── web/           # React Frontend (SPA)
│   └── api/           # NestJS Backend (API)
├── packages/
│   ├── shared/        # Tipos compartilhados
│   └── database/      # Schema Supabase
├── supabase/          # Migrations e config
└── .github/
    └── workflows/     # CI/CD automático
```

## 1️⃣ Clonar e Configurar Repositório

```bash
# Clone
git clone https://github.com/seu-usuario/feitico.git
cd feitico

# Instalar dependências (Turborepo)
npm install

# Verificar setup
npm run dev
# Deve Iniciar tanto web (localhost:5173) quanto api (localhost:3333)
```

## 2️⃣ Configurar Variáveis de Ambiente

### Backend (`apps/api/.env.development`)

```bash
# Copiar exemplo
cp apps/api/.env.example apps/api/.env.development

# Editar com seus valores Supabase
# Obter em: https://app.supabase.com/project/[PROJECT_ID]/settings/api
cat > apps/api/.env.development << 'EOF'
NODE_ENV=development
PORT=3333

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

JWT_SECRET=dev_secret_key_min_32_chars_long

CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
EOF
```

### Frontend (`apps/web/.env.development`)

```bash
# Copiar exemplo
cp apps/web/.env.example apps/web/.env.development

# Editar com valores
cat > apps/web/.env.development << 'EOF'
VITE_API_URL=http://localhost:3333/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key_here
EOF
```

## 3️⃣ Executar Aplicação

### Opção A: Ambos simultaneamente (recomendado)

```bash
# Na raiz do projeto
npm run dev

# Saída esperada:
# ✓ apps/web built sucessfully
# ✓ apps/api listening on port 3333
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3333/api/v1
```

### Opção B: Separadamente

```bash
# Terminal 1: Backend
cd apps/api
npm run dev
# Aguarde: "Nest application successfully started"

# Terminal 2: Frontend
cd apps/web
npm run dev
# Acesse: http://localhost:5173
```

## 4️⃣ Testar Conectividade

### Verificar Backend

```bash
# Terminal abierto com backend rodando
curl http://localhost:3333/health
# Esperado: {"status":"ok"}

curl http://localhost:3333/api/v1/professionals
# Esperado: [] ou lista de profissionais se tiver dados
```

### Verificar Frontend

```bash
# Abrir navegador
open http://localhost:5173

# Verificar no DevTools:
# - Console → Não deve ter erros
# - Network → Requests para localhost:3333 devem retornar 200
# - LocalStorage → Após login, deve ter 'authToken'
```

## 5️⃣ Dados de Teste

### Inserir dados de teste no Supabase

```bash
# Acessar Supabase SQL Editor
# https://app.supabase.com/project/[PROJECT_ID]/sql

# Copiar e executar os scripts em:
# - supabase/migrations/[date]_*.sql
# - BACKEND_SUPABASE_IMPLEMENTATION.md (seção "Dados de Teste")
```

### Testar em Admin

1. Navegue para `http://localhost:5173/admin`
2. Login com email: `admin@salon.com` password: `admin123`
   - (ou use credenciais criadas no Supabase)
3. Deve carregar:
   - Dashboard com estatísticas
   - Lista de reservas
   - Lista de profissionais
   - Lista de serviços

## 6️⃣ Desenvolvimento

### Estrutura de Desenvolvimento

**Frontend** (`apps/web/src/`)
```
- components/     # React components
  - admin/        # Painel administrativo
  - landing/      # Página pública
  - ui/           # Componentes base (shadcn/ui)
- hooks/          # Custom React hooks
- pages/          # Rotas principales
- services/       # API client, Supabase client
- lib/            # Utilitários
```

**Backend** (`apps/api/src/`)
```
- modules/        # Feature modules
  - bookings/
  - professionals/
  - services/
  - gallery/
  - testimonials/
  - auth/
- integrations/   # Supabase client
- common/         # Filters, interceptors, pipes
```

### Fluxo de Desenvolvimento

1. **Criar feature no backend**
   - Novo arquivo em `apps/api/src/modules/[feature]/`
   - Implementar service com Supabase queries
   - Criar controller com rota

2. **Testar com curl**
   ```bash
   curl http://localhost:3333/api/v1/[resource]
   ```

3. **Criar hook no frontend**
   - Arquivo em `apps/web/src/hooks/use[Feature].ts`
   - Usar API client para chamar backend

4. **Usar em componente**
   ```tsx
   const { data, loading } = use[Feature]();
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: [feature description]"
   git push origin main
   # Deploy automático via GitHub Actions
   ```

## 🧪 Testar Aplicação

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Lint
npm run lint

# Build production
npm run build
```

## 🐛 Troubleshooting

### "ECONNREFUSED" ao conectar no Supabase

```bash
# Verificar credenciais em .env
cat apps/api/.env.development | grep SUPABASE_URL

# Pingue Supabase
curl https://your-project.supabase.co/rest/v1/

# Se falhar, checkout credenciais em:
# https://app.supabase.com/project/[PROJECT_ID]/settings/api
```

### Frontend mostra "API Error"

```bash
# Verificar se backend está rodando
curl http://localhost:3333/health

# Verificar CORS error no DevTools
# Deve ter header: "Access-Control-Allow-Origin": "http://localhost:5173"

# Se não: verificar CORS_ORIGIN em apps/api/.env.development
```

### "Module not found" errors

```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
npm install

# Se persistir, verificar TypeScript configs
npx tsc --noEmit
```

## 📚 Próximos Passos

1. ✅ Setup completo localmente
2. ✅ Criar primeira reserva via UI
3. ✅ Testar login/autenticação
4. ✅ Implementar validações faltantes
5. ✅ Deploy staging (Vercel)
6. ✅ QA testing
7. ✅ Deploy produção

## 📖 Documentação

- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Deploy para produção
- [FRONTEND_API_INTEGRATION.md](./FRONTEND_API_INTEGRATION.md) - Integrar UI com API
- [BACKEND_SUPABASE_IMPLEMENTATION.md](./BACKEND_SUPABASE_IMPLEMENTATION.md) - Implementar endpoints
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Visão geral da arquitetura
- [README.md](./README.md) - Informações gerais do projeto

## 💬 Suporte

**Erro no backend?**
- Verificar logs em terminal onde rodando `npm run dev`
- Consultar [BACKEND_SUPABASE_IMPLEMENTATION.md](./BACKEND_SUPABASE_IMPLEMENTATION.md#debugging)

**Erro no frontend?**
- Abrir DevTools (F12) → Console
- Verificar Network tab para erros HTTP
- Consultar [FRONTEND_API_INTEGRATION.md](./FRONTEND_API_INTEGRATION.md#error-handling-centralizado)

**Perguntas sobre deploy?**
- Ler [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Ou criar issue no GitHub
