# 🗑️ Remover Lovable.dev - Guia de Migração

O Lovable.dev foi usado para bootstrap inicial. Agora que temos uma estrutura produção-ready, precisamos remover todas as referências.

## 📋 Checklist de Remoção

### 1. Frontend PWA (apps/web)

**Arquivo:** `src/hooks/usePwaInstall.ts`

**Ação:**

- Remover a verificação que bloqueia lovable.dev
- Simplificar para:

```typescript
// ❌ ANTES
if (["lovable.dev", "localhost"].includes(host)) {
  // Toast com instrução
  return;
}

// ✅ DEPOIS
if (host === "localhost") {
  // Apenas bloqueia em localhost dev
  return;
}
```

### 2. Public Assets

**Arquivos:** `public/manifest.json`

**Verificar:**

```json
{
  "start_url": "/", // ✅ OK - relativo
  "scope": "/" // ✅ OK - relativo
}
```

Se houver `https://lovable.dev`, mudar para seu domínio:

```json
{
  "start_url": "https://yourdomain.com/",
  "scope": "https://yourdomain.com/"
}
```

### 3. Supabase Configuration (apps/web)

**Arquivo:** `src/integrations/supabase/client.ts`

**Verificar:**

```typescript
// ✅ Deve usar variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// ❌ Nunca hardcodado
```

### 4. Remover Lovable Dependencies (se houver)

```bash
grep -r "@lovable" apps/
grep -r "lovable" package.json apps/*/package.json
```

Se encontrou, remover:

```bash
npm remove @lovable/... --workspace=@feitico/web
```

### 5. Vite Config

**Arquivo:** `apps/web/vite.config.ts`

**Verificar:**

- Remover plugins específicos de Lovable
- PWA plugin deve estar configurado corretamente

```typescript
// ✅ OK
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    // ... seu config
    VitePWA({
      /* config */
    }),
  ],
});
```

### 6. Git & Version Control

```bash
# Procurar por últimas referências
git log --all --oneline -- *lovable*
git log -p -S "lovable" -- apps/web

# Remover histórico se necessário (advanced)
git filter-branch --tree-filter 'grep -r "lovable" . && sed -i "s/lovable.dev//g" $(git ls-files) || true' HEAD
```

### 7. Environment Files

**Arquivos:** `.env.example`, `.env.development`, `.env.production`

**Verificar:**

```bash
# ❌ Remover
LOVABLE_API_URL=...
LOVABLE_TOKEN=...

# ✅ Manter apenas
VITE_API_URL=http://localhost:3333/api/v1
VITE_SUPABASE_URL=...
```

### 8. README.md & Documentação

**Ação:**

- Remover seções que mencionam "Lovable"
- Atualizar setup instructions
- Adicionar links para deploy (Vercel, Docker)

Procurar:

```bash
grep -i lovable README.md docs/*.md
```

## 🔍 Busca Completa

```bash
# Buscar todas as referências
echo "=== Lovable refs ==="
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" \) \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  -exec grep -l "lovable\|Lovable\|LOVABLE" {} \;

# Resultado esperado: 0 matches (fora node_modules)
```

## ✅ Validação Pós-Remoção

Depois de remover:

```bash
# 1. Build do frontend
cd apps/web
npm run build

# 2. Verificar PWA manifest
cat dist/manifest.json

# 3. Verificar service worker
grep "lovable" dist/sw.js || echo "✅ Clean!"

# 4. Verificar dist
npm run lint && npm run typecheck

# 5. Test PWA install (local)
npx serve dist
```

## 📝 Notas Importantes

- **Supabase RLS**: Se você tem políticas que verificam host, atualize-as
- **CORS**: Certificar que API tem CORS configurado para seu domínio
- **SSL Certificates**: Setup Let's Encrypt se usando Docker/Traefik
- **DNS**: Apontar seu domínio para o servidor correto

## 🚀 Após Remover Lovable

```bash
# 1. Commit
git add -A
git commit -m "refactor: remove lovable.dev references, production-ready"

# 2. Deploy
./deploy.sh dev
./deploy.sh prod
```
