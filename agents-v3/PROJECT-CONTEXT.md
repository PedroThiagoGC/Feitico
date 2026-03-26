# PROJECT-CONTEXT.md
# ─────────────────────────────────────────────────────────────────────────────
# TEMPLATE DE REFERÊNCIA: neste repositório, o contexto ativo é o arquivo raiz
# `PROJECT-CONTEXT.md`. Use este arquivo apenas como modelo para novos projetos.
# Preencha este arquivo por projeto. É o ÚNICO arquivo que muda entre projetos.
# Todos os agentes verificam se ele existe E se está completo antes de agir.
# Campos marcados com ⚠️ são críticos — agentes bloqueiam sem eles.
# ─────────────────────────────────────────────────────────────────────────────

## Identidade do Projeto

- **Nome**: [ex: Nexus]
- **Tipo**: [ex: SaaS B2B / sistema de salão único]
- **Descrição**: [1-2 linhas do que o produto faz]
- **Idioma da documentação**: [Português / English]
- **Frequência de deploy**: [ex: várias vezes por dia / semanal / mensal]
  # ↑ usado pelo doc-writer para calcular o threshold de staleness de documentação

---

## ⚠️ Stack Tecnológica

### Frontend
- **Framework**: [ex: Next.js 14 App Router]
- **UI**: [ex: shadcn/ui + TailwindCSS]
- **Estado global**: [ex: Zustand]
- **Fetch/Cache**: [ex: TanStack Query v5]
- **Formulários**: [ex: React Hook Form + Zod]
- **HTTP client**: [ex: Axios — instância configurada em @/lib/axios]
- **Notificações/Toast**: [ex: react-hot-toast em @/lib/toast / sonner / nenhum ainda]
- **Diretiva SSR**: [ex: 'use client' apenas com hooks de estado/efeito/eventos]

### Backend
- **Framework**: [ex: NestJS]
- **ORM**: ⚠️ [ex: TypeORM] ← agentes usarão APENAS este padrão, ignoram os outros
- **Banco de dados**: ⚠️ [ex: PostgreSQL 16]
- **Auth**: [ex: JWT + Refresh Tokens via httpOnly cookies]
- **Validação/DTO**: [ex: nestjs-zod]
- **Rate limiting**: [ex: @nestjs/throttler — configurado no AppModule]
- **Logger**: [ex: winston em src/shared/logger / pino / console estruturado]
- **Serialização de response**: [ex: class-transformer com @Exclude por padrão]
- **Infra adicional**: [ex: Redis, S3, BullMQ / nenhuma]

### Monorepo / Build
- **Tooling**: [ex: Turborepo + pnpm]
- **Pacote de tipos compartilhados**: ⚠️ [ex: @projeto/types em packages/types/src/]
- **Runtime**: [ex: Node.js 20 / Bun]

---

## ⚠️ Estrutura de Diretórios

```
[Preencha com a estrutura REAL — os agentes derivam todos os caminhos daqui]

apps/
  web/src/
    app/
    modules/
      {modulo}/
        components/
        hooks/
        services/
        store/
  api/src/
    modules/
      {modulo}/
        controllers/
        services/
        entities/
        dto/
        guards/
packages/
  types/src/
    {dominio}/
    index.ts
```

---

## ⚠️ Convenções Obrigatórias

### Nomenclatura
- **Arquivos**: [ex: kebab-case → login-form.tsx, auth.service.ts]
- **Componentes React**: [ex: PascalCase → LoginForm, MemberCard]
- **Hooks**: [ex: prefixo use → useAuth, useMembers]
- **Stores**: [ex: sufixo Store → authStore, useAuthStore]
- **Classes backend**: [ex: PascalCase → AuthService, CreateMemberDto]
- **TypeScript**: ⚠️ [ex: usar `type`, nunca `interface`]
- **Constantes**: [ex: UPPER_SNAKE_CASE]

### Rotas (frontend)
- [ex: Rotas em português: /login, /membros, /configuracoes]

### Arquivos de teste
- [ex: backend → {name}.spec.ts | frontend → {name}.test.tsx]

### API Versioning
- [ex: /v1/ prefix em todos os endpoints / sem versionamento / header-based]

---

## ⚠️ Segurança e Isolamento de Dados

- **Modelo**: ⚠️ [ex: salão único / Row-level com organization_id]
- **Origem do contexto de dados**: ⚠️ [ex: JWT/session — nunca do request body ou URL params]
- **Regra de query**: ⚠️ [ex: Toda query que usa escopo filtra por salon_id/organization_id]
- **Cross-context response**: [ex: 404 (não 403) para evitar enumeração]
- **Cross-schema FKs**: [ex: Proibido — weak UUID references; ver ADR-001]

---

## ⚠️ Banco de Dados

- **Schemas/databases**: ⚠️ [ex: `public` (global) + `core` (por tenant)]
- **Tabelas globais** (sem tenant ID): [ex: users, organizations, refresh_tokens]
- **Tabelas de tenant** (com tenant ID): [ex: members, roles, permissions]
- **ID strategy**: ⚠️ [ex: UUID via gen_random_uuid()]
- **Soft delete**: [ex: deleted_at TIMESTAMPTZ NULL]
- **updated_at**: [ex: TypeORM @UpdateDateColumn / trigger SQL / Prisma @updatedAt]
- **Naming**: [ex: snake_case para tudo]
- **Formato de timestamp de migration**: [ex: 13 dígitos unix ms (TypeORM default)]
- **Seeding**: [ex: scripts/seed.ts via `pnpm seed` / prisma/seed.ts]

---

## ⚠️ Tipos Compartilhados

- **Pacote**: ⚠️ [ex: @projeto/types em packages/types/src/]
- **Domínios existentes**: [ex: auth/, users/, organizations/, members/]
- **Padrão de schema**: ⚠️ [ex: {Nome}Schema → type {Nome} = z.infer<typeof {Nome}Schema>]
- **Enums**: [ex: z.enum() por padrão]
- **Datas**: [ex: z.string().datetime() para JSON / z.date() para server-side]
- **OpenAPI generation**: [ex: @anatine/zod-openapi — usar .describe() nos schemas / não usa]

---

## Paginação

- **Estratégia**: [ex: page/limit / cursor-based]
- **Input**: [ex: `{ page: number, limit: number }`]
- **Output**: [ex: `{ data: T[], total: number, page: number, limit: number }`]
- **Defaults**: [ex: limit=20, max=100]

---

## Módulos Existentes

> Preencha à medida que o projeto cresce. Ajuda os agentes a não duplicar.

| Módulo | Backend | Frontend | Types | README | Swagger | Testes |
|--------|---------|----------|-------|--------|---------|--------|
| auth   | ✅      | ✅       | ✅    | ✅     | ✅      | ✅     |
| users  | ✅      | ✅       | ✅    | ❌     | ❌      | ⚠️ parcial |
| [...]  |         |          |       |        |         |        |

---

## Dependências e Integrações Externas

- [ex: Stripe — pagamentos — módulo billing/]
- [ex: SendGrid — emails — módulo notifications/]
- [ex: Nenhuma ainda]

---

## ⚠️ Restrições Absolutas

> Todos os agentes respeitam estas regras sem exceção.

- [ex: Nunca usar `any` sem comentário justificando]
- [ex: Nunca fazer fetch direto em componentes React]
- [ex: Nunca criar FK entre schemas public e core]
- [ex: Nunca aceitar organization_id do request body]
- [ex: Nunca alterar migrations já aplicadas]
- [ex: Nunca expor stack traces em produção]
- [ex: Nunca logar senhas, tokens ou PII]

---

## ADRs Registrados

> doc-writer e architect atualizam esta tabela ao criar novos ADRs.

| Número | Título | Status | Data |
|--------|--------|--------|------|
| ADR-001 | [ex: Row-level tenancy vs database-per-tenant] | Aceito | 2024-01-15 |

---

## Contexto Adicional

> Texto livre — decisões recentes, débitos técnicos, contexto não óbvio.

```
[cole aqui]
```
