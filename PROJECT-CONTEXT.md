# PROJECT-CONTEXT.md
# ─────────────────────────────────────────────────────────────────────────────
# Arquivo de contexto do projeto Feitico — lido por todos os agentes.
# Campos marcados com ⚠️ são críticos — agentes bloqueiam sem eles.
# ─────────────────────────────────────────────────────────────────────────────

## Identidade do Projeto

- **Nome**: Feitico
- **Tipo**: SaaS B2C multi-tenant — gestão e agendamento de salão de beleza
- **Descrição**: Plataforma que permite salões de beleza terem landing page pública com agendamento online e painel administrativo completo (serviços, profissionais, agenda, financeiro, galeria, depoimentos). SuperAdmin gerencia tenants, planos e usuários da plataforma.
- **Idioma da documentação**: Português
- **Frequência de deploy**: sob demanda (feature-driven, sem CI automático ainda)

---

## ⚠️ Stack Tecnológica

### Frontend (única camada de aplicação — sem backend próprio)
- **Framework**: React 18 + TypeScript + Vite 8
- **UI**: shadcn/ui + TailwindCSS 3 — componentes em `src/components/ui/`
- **Roteamento**: React Router DOM v6 (`src/App.tsx`)
- **Estado global**: não há store global — estado local com hooks por domínio
- **Fetch/Cache**: TanStack Query v5 (`@tanstack/react-query`) — hooks em `src/hooks/`
- **Formulários**: React Hook Form v7 + Zod v3
- **Notificações/Toast**: `sonner` — importar `toast` de `sonner`
- **PWA**: `vite-plugin-pwa` — lógica em `src/components/pwa/` e `src/hooks/usePwaInstall.ts`
- **Datas**: `date-fns` v3

### Backend / BaaS
- **BaaS**: Supabase (Auth, PostgreSQL 16, Storage, Realtime)
- **ORM**: ⚠️ Nenhum — acesso via Supabase JS client (`@supabase/supabase-js`)
- **Banco de dados**: ⚠️ PostgreSQL 16 (gerenciado pelo Supabase)
- **Auth**: Supabase Auth — sessão gerenciada pelo cliente Supabase
- **Validação**: Zod — schemas em `src/schemas/` (a criar — Fase 1)
- **Migrations**: Supabase CLI — arquivos em `supabase/migrations/` (timestamp 13 dígitos)
- **Seeding**: não configurado ainda
- **Rate limiting**: Supabase nativo (sem configuração adicional no app)
- **Logger**: `console` estruturado (sem logger configurado — pendência Fase 3)
- **Infra adicional**: Supabase Storage para imagens (logos, galeria, fotos profissionais)

### Monorepo / Build
- **Tooling**: SPA única — npm + Vite (sem monorepo, sem Turborepo)
- **Pacote de tipos compartilhados**: ⚠️ `src/integrations/supabase/types.ts` (gerado automaticamente pelo Supabase CLI — NÃO editar manualmente)
- **Runtime**: Node.js 20
- **Deploy**: Vercel (variáveis configuradas no painel Vercel)

---

## ⚠️ Estrutura de Diretórios

```
src/
  App.tsx                    ← roteamento principal
  main.tsx
  pages/
    Index.tsx                ← landing page pública (rota /)
    Admin.tsx                ← painel admin do salão (rota /admin)
    SuperAdmin.tsx           ← painel superadmin da plataforma (rota /superadmin)
    NotFound.tsx
  components/
    landing/                 ← componentes da landing page pública
      Header.tsx, Hero.tsx, About.tsx, Services.tsx, Booking.tsx
      Gallery.tsx, Testimonials.tsx, VideoSection.tsx, Footer.tsx
    admin/                   ← componentes do painel admin do salão
      AdminBookings.tsx, AdminCalendar.tsx, AdminServices.tsx
      AdminProfessionals.tsx, AdminAvailability.tsx, AdminFinancials.tsx
      AdminGallery.tsx, AdminSalon.tsx, AdminTestimonials.tsx
      ImageUpload.tsx, OpeningHoursEditor.tsx
    superadmin/              ← componentes do painel superadmin
      SuperAdminLayout.tsx, SuperAdminLogin.tsx, SuperAdminDashboard.tsx
      SuperAdminTenants.tsx, SuperAdminTenantDetail.tsx, SuperAdminTenantNew.tsx
      SuperAdminPlans.tsx, SuperAdminUsers.tsx, SuperAdminFinancial.tsx
      SuperAdminAudit.tsx
    pwa/
      PwaAssistant.tsx
    ui/                      ← shadcn/ui — NÃO modificar diretamente
  hooks/                     ← hooks TanStack Query por domínio (query + mutation only)
    useBooking.ts
    useSalon.ts
    useServices.ts
    useProfessionals.ts
    useGallery.ts
    useTestimonials.ts
    usePwaInstall.ts
    usePwaNotifications.ts
    useScrollAnimation.ts
    use-mobile.tsx
    use-toast.ts
  services/                  ← ⚠️ A CRIAR (Fase 1) — lógica de negócio por domínio
    bookingService.ts        (pendente)
    salonService.ts          (pendente)
    professionalService.ts   (pendente)
  schemas/                   ← ⚠️ A CRIAR (Fase 1) — schemas Zod por domínio
    booking.ts               (pendente)
    salon.ts                 (pendente)
    professional.ts          (pendente)
  integrations/
    supabase/
      client.ts              ← instância Supabase — importar daqui sempre
      types.ts               ← tipos gerados (NÃO editar)
  lib/
    utils.ts                 ← cn() e utilitários gerais
    phone.ts                 ← formatação/normalização de telefone
  assets/
supabase/
  config.toml
  migrations/                ← migrations Supabase CLI
docs/
  ARQUITETURA-E-ROADMAP.md  ← documento técnico e roadmap de fases
agents-v3/
  PROJECT-CONTEXT.md        ← template original dos agentes (não usar para este projeto)
  agents/                   ← definições dos agentes (fonte)
```

---

## ⚠️ Convenções Obrigatórias

### Nomenclatura
- **Arquivos**: kebab-case → `booking-form.tsx`, `salon-service.ts`
- **Componentes React**: PascalCase → `BookingForm`, `AdminCalendar`
- **Hooks**: prefixo `use` → `useBooking`, `useSalon`
- **Services**: sufixo `Service` → `bookingService`, `salonService` (objeto, não classe)
- **Schemas Zod**: sufixo `Schema` → `BookingSchema`, `SalonSchema`
- **TypeScript**: ⚠️ preferir `type` em vez de `interface` para contratos de domínio
- **Constantes**: UPPER_SNAKE_CASE

### Acesso ao Supabase
- ⚠️ **Sempre** importar o cliente de `@/integrations/supabase/client`
- ⚠️ **Nunca** criar nova instância do cliente Supabase fora de `client.ts`
- Tipos de tabela: usar `Database['public']['Tables']['nome']['Row']` de `types.ts`

### Hooks vs Services
- Hooks (`src/hooks/`): apenas wrappers TanStack Query (useQuery, useMutation) — sem lógica de negócio
- Services (`src/services/`): funções puras com lógica de negócio, validações, transformações

### Rotas (frontend)
- Rotas em inglês curto: `/`, `/admin`, `/superadmin`
- Admin: sub-navegação por tabs dentro do painel (não sub-rotas separadas)

### Arquivos de teste
- Unitário/componente: `{name}.test.tsx` (Vitest + Testing Library)
- E2E: `{name}.spec.ts` (Playwright — configurado em `playwright.config.ts`)

### Variáveis de ambiente
- `VITE_*`: expostas no bundle frontend — apenas dados não sensíveis
- Sem prefixo `VITE_`: apenas Vercel/servidor — nunca acessar via `import.meta.env` no client
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` NUNCA com prefixo `VITE_`

---

## ⚠️ Segurança e Multi-tenancy

- **Modelo**: Row-level com `salon_id` para dados operacionais, `tenant_id` para configurações de plataforma
- **Origem do tenant/salon ID**: ⚠️ sempre do contexto autenticado (sessão Supabase) — nunca de params de URL ou body de formulário
- **Regra de query**: toda query em tabelas operacionais filtra por `salon_id`; tabelas de plataforma filtram por `tenant_id`
- **RLS**: Supabase Row Level Security habilitado nas tabelas — as policies são a linha de defesa principal
- **Cross-tenant response**: tratar como 404 para evitar enumeração
- **SuperAdmin**: acesso via `platform_users.role = 'superadmin'` — verificar em RLS policies

---

## ⚠️ Banco de Dados

- **Schema**: `public` (único schema — sem separação schema-per-tenant)
- **Tabelas globais** (sem tenant_id): `tenants`, `subscription_plans`, `audit_logs`
- **Tabelas de tenant/salon** (com salon_id ou tenant_id):
  - salon-scoped: `salons`, `services`, `professionals`, `bookings`, `availability`, `gallery_images`
  - professional-scoped: `professional_availability`, `professional_exceptions`, `professional_services`
  - tenant-scoped: `platform_users`, `tenant_branding`, `tenant_details`, `tenant_settings`
- **ID strategy**: ⚠️ UUID via `gen_random_uuid()` (padrão Supabase)
- **Soft delete**: não implementado (delete físico por enquanto)
- **updated_at**: `updated_at` com default e trigger Supabase onde aplicável
- **Naming**: snake_case para tudo
- **Formato de timestamp de migration**: 14 dígitos — ex: `20260317181814`
- **Seeding**: não configurado

---

## ⚠️ Tipos Compartilhados

- **Fonte autoritativa**: `src/integrations/supabase/types.ts` (gerado pelo Supabase CLI)
- **NÃO editar** `types.ts` manualmente — regenerar com `supabase gen types typescript`
- **Para tipos de domínio/aplicação**: criar em `src/schemas/` com Zod e derivar `type` de `z.infer<>`
- **Padrão**: `const BookingSchema = z.object({...})` → `type Booking = z.infer<typeof BookingSchema>`
- **Enums**: `z.enum(['valor1', 'valor2'])` — nunca TypeScript enum nativo
- **Datas**: `z.string().datetime()` para JSON/API; `z.string()` com `.date()` para campos de data
- **OpenAPI**: não usa geração automática de OpenAPI

---

## Paginação

- **Estratégia**: não padronizada ainda — cada query usa `limit` do Supabase diretamente
- **Pendência**: padronizar wrapper de paginação (Fase 3)

---

## Módulos Existentes

| Módulo | Hooks | Service | Schema Zod | Componentes | Testes |
|--------|-------|---------|------------|-------------|--------|
| salon | ✅ useSalon | ✅ salonService | ✅ salon.ts | ✅ AdminSalon | ❌ |
| booking | ✅ useBooking | ✅ bookingService | ✅ booking.ts | ✅ AdminBookings, AdminCalendar, Booking | ❌ |
| professional | ✅ useProfessionals | ✅ professionalService | ✅ professional.ts | ✅ AdminProfessionals | ❌ |
| service | ✅ useServices | ✅ servicesService | ✅ service.ts | ✅ AdminServices, Services | ❌ |
| gallery | ✅ useGallery | ✅ galleryService | ✅ gallery.ts | ✅ AdminGallery, Gallery | ❌ |
| testimonial | ✅ useTestimonials | ✅ testimonialService | ✅ testimonial.ts | ✅ AdminTestimonials, Testimonials | ❌ |
| availability | dentro de bookingService | ✅ bookingService | ❌ pendente | ✅ AdminAvailability | ❌ |
| financials | ❌ (direto no componente) | ❌ pendente | ❌ pendente | ✅ AdminFinancials | ❌ |
| superadmin | ❌ inline | ❌ pendente | ❌ pendente | ✅ SuperAdmin* | ❌ |

---

## Dependências e Integrações Externas

- **Supabase** — BaaS completo (Auth, DB, Storage, Realtime) — `src/integrations/supabase/`
- **Vercel** — deploy e variáveis de ambiente de produção
- **PWA** — vite-plugin-pwa + hooks de instalação/notificação

---

## ⚠️ Restrições Absolutas

- Nunca usar `any` sem comentário justificando
- Nunca fazer fetch direto ao Supabase dentro de componentes React — usar hooks em `src/hooks/`
- Nunca criar nova instância do Supabase client fora de `src/integrations/supabase/client.ts`
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no bundle frontend
- Nunca editar `src/integrations/supabase/types.ts` manualmente
- Nunca alterar migrations já aplicadas — criar nova migration
- Nunca logar senhas, tokens ou dados pessoais (PII)
- Nunca aceitar `salon_id` ou `tenant_id` de body/params sem validar contra sessão autenticada
- Nunca modificar componentes em `src/components/ui/` diretamente — compor sobre eles

---

## ADRs Registrados

| Número | Título | Status | Data |
|--------|--------|--------|------|
| — | Nenhum ADR formal registrado ainda | — | — |

---

## Roadmap de Fases (docs/ARQUITETURA-E-ROADMAP.md)

| Fase | Descrição | Status |
|------|-----------|--------|
| Fase 0 | Hardening: externalizar vars de ambiente, remover hardcodes | ✅ Concluída |
| Fase 1 | Fundação: criar `src/services/`, `src/schemas/`, eliminar `any` no admin | ✅ Concluída (2026-03-25) |
| Fase 2 | Confiabilidade: validação de conflito de horário server-side, padronização de erros de agendamento | ⏳ Pendente |
| Fase 3 | Escalabilidade: split por features, Error Boundaries, suite de testes, logger | ⏳ Pendente |

---

## Contexto Adicional

```
- O projeto era inicialmente uma SPA simples; está evoluindo para arquitetura
  mais modular sem quebrar URLs existentes.
- O diretório apps/ (apps/api, apps/web) existe mas contém apenas dist/ e
  node_modules/ — são artefatos de build sem código-fonte. Ignorar.
- Multi-tenancy: cada "salão" é identificado por salon_id. O conceito de
  "tenant" é mais abrangente e agrupa configurações de plataforma (branding,
  settings, plans) via tenant_id. A relação tenant→salon é 1:N.
- SuperAdmin é uma área separada da plataforma que gerencia todos os tenants,
  planos de assinatura e usuários da plataforma (não usuários de salão).
- PWA está implementado para instalação no mobile com notificações.
- Não há backend Node.js/NestJS — toda lógica server-side é Supabase
  (RLS policies, functions, triggers).
```
