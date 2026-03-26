# Agents Kit v3

8 agentes Claude especializados para todo o ciclo de desenvolvimento. Um único `PROJECT-CONTEXT.md` configura todos para o projeto específico.

---

## Estrutura

```
agents-kit/
├── README.md
├── PROJECT-CONTEXT.md         ← ÚNICO arquivo que muda por projeto
└── agents/
    ├── architect.md
    ├── backend-dev.md
    ├── frontend-dev.md
    ├── code-reviewer.md
    ├── test-writer.md
    ├── types-manager.md
    ├── db-architect.md
    └── doc-writer.md
```

---

## Setup em um novo projeto

```bash
# 1. Copie para a raiz do projeto ou .claude/
cp PROJECT-CONTEXT.md meu-projeto/
# ou
cp PROJECT-CONTEXT.md meu-projeto/.claude/PROJECT-CONTEXT.md

# 2. Preencha o PROJECT-CONTEXT.md — todos os campos ⚠️ são obrigatórios

# 3. Copie os agentes
mkdir -p meu-projeto/.claude/agents
cp agents/*.md meu-projeto/.claude/agents/
```

**Todos os agentes bloqueiam e pedem preenchimento se PROJECT-CONTEXT.md não existir ou estiver incompleto.**

---

## Qual agente usar

| Situação | Agente |
|----------|--------|
| Decisão afeta 3+ módulos, nova arquitetura, ADR | `architect` |
| Novo endpoint, service, controller, guard, entity | `backend-dev` |
| Novo componente, hook, form, página, store | `frontend-dev` |
| Revisão de código, pré-merge | `code-reviewer` |
| Testes para código novo ou fix de bug | `test-writer` |
| Novo schema Zod, tipo derivado, revisão de tipos | `types-manager` |
| Nova tabela, migration, índice, query | `db-architect` |
| README, JSDoc, Swagger, CHANGELOG, ADR | `doc-writer` |

**Não use `architect` para:**
- Adicionar campo a uma entidade → `db-architect` + `types-manager`
- Novo endpoint em módulo existente → `backend-dev`
- Qualquer coisa que siga padrão já estabelecido → agente especialista direto

---

## Fluxo recomendado por tipo de tarefa

```
Feature nova (cross-cutting)
  architect → types-manager → db-architect → backend-dev → frontend-dev → test-writer → doc-writer

Novo endpoint (módulo existente)
  backend-dev → test-writer → doc-writer

Novo componente
  frontend-dev → test-writer

Bug fix
  code-reviewer (diagnóstico) → agente correto (fix) → test-writer (regressão)

Decisão arquitetural
  architect → doc-writer (ADR)
```

---

## O que mudou na v3 (vs v2)

### Correções transversais
| Problema | Correção |
|----------|----------|
| Paths hardcoded nos startup sequences | Todos os agentes derivam caminhos do PROJECT-CONTEXT.md |
| PROJECT-CONTEXT.md verificava só existência | Agora verifica se campos ⚠️ estão preenchidos |
| Nenhum agente tinha exemplos negativos no `description` | Todos têm exemplos de quando NÃO usar |

### Por agente

**`architect`**
- Comandos bash concretos no startup (não prosa vaga)
- Template de output estruturado para module planning (formato fixo, não livre)
- Dependency graph com formato definido (`→` / `←`)
- Template de output para code review (consistente com code-reviewer)
- Protocolo quando developer ignora confirmação (registra em memória, não bloqueia)
- Confirmação ⏳ sempre no idioma do developer

**`backend-dev`**
- Tabela completa de HTTP status codes com critério de uso
- Rate limiting e CORS como requisitos de segurança explícitos
- Serialização de response obrigatória (sem raw entities)
- Module registration condicional ao framework do PROJECT-CONTEXT.md
- API versioning e estratégia de breaking changes
- Idempotency para POST endpoints de criação

**`frontend-dev`**
- Error Boundaries — obrigatório em lazy-loaded e Suspense
- Variáveis de ambiente — nunca secrets em `NEXT_PUBLIC_*`
- `'use client'` com default claro (Server Component se não especificado)
- Mutation feedback obrigatório (toast/inline — nunca falha silenciosa)
- `useSuspenseQuery` como padrão moderno (TanStack Query v5 + React 18)
- Optimistic updates com padrão `onMutate`/`onError`/`onSettled`
- Nota no exemplo de form: adaptar ao UI component library do projeto

**`code-reviewer`**
- `git diff --name-only` para estabelecer escopo da revisão (não revisar às cegas)
- Comandos grep concretos com `-E` e `|` (sem placeholders literais)
- `Bash` adicionado à lista de ferramentas
- Checklist específico para migrations no escopo da revisão
- Verificação de novas dependências (`npm audit`, licença, tamanho)
- Verificação de breaking changes em API contracts
- Verdict "Approved with Follow-up" (entre Approved e Changes Requested)
- Memória salva falsos positivos confirmados para não repetir

**`test-writer`**
- Factory IDs usam `randomUUID()` — nunca `'test-uuid-1'` estático
- Imports de exceções presentes no template (sem `UnauthorizedException` undefined)
- `renderWithProviders` wrapper para componentes com QueryClient/providers
- `findBy*` e `waitFor` para estados assíncronos — sem `sleep()`
- Posição clara sobre snapshot tests: evitar, usar assertions específicas
- `jest.mock()` vs `jest.spyOn()` com critério de escolha
- Coverage obrigatória e reportada (não "se possível")
- `--runInBand` para testes de integração com estado compartilhado

**`types-manager`**
- `.partial()` para PATCH/update DTOs — todos os campos opcionais
- `z.coerce.number()`, `z.coerce.boolean()` para query params e form data
- `z.transform()` para normalização (trim, lowercase, parse)
- Tabela de file naming consistente com naming convention (sem contradição interna)
- `z.discriminatedUnion()` para tipos polimórficos
- `.describe()` para geração de OpenAPI
- Estratégia de breaking changes em schemas (versionamento, migração gradual)

**`db-architect`**
- Bug crítico corrigido: batch UPDATE usa subquery (não `LIMIT` direto — sintaxe MySQL)
- `updated_at` não auto-atualiza no PostgreSQL sem trigger ou ORM mechanism — documentado e template inclui trigger
- Unique constraints: quando criar (campos business-unique, concorrência)
- Cross-service transactions: pattern de passar QueryRunner explicitamente
- Soft delete por ORM: TypeORM `@DeleteDateColumn`, Prisma manual, Drizzle manual
- Database seeding separado de migrations
- Formato de timestamp de migration lido do projeto (não assumido)
- Drizzle: aviso de verificar versão antes de usar o pattern

**`doc-writer`**
- `grep -rE` com `-E` flag (regex correta para múltiplos patterns)
- Template separado para Frontend Module README (além do Backend)
- JSDoc para React hooks e componentes (além de backend services)
- ADR template sincronizado com `architect.md` (mesma estrutura, incluindo "Future Considerations")
- Template de Onboarding Guide completo
- `@deprecated` JSDoc tag documentada
- Seção de Environment Variables no README template
- Staleness threshold dinâmico baseado em frequência de deploy do PROJECT-CONTEXT.md

**`PROJECT-CONTEXT.md`**
- Campos ⚠️ marcados como críticos (agentes bloqueiam sem eles)
- Frequência de deploy (para threshold de staleness do doc-writer)
- Toast/notification library (para mutation feedback do frontend-dev)
- Logger location (para backend-dev não criar novo logger)
- Response serialization mechanism (para backend-dev)
- Rate limiting location (para backend-dev)
- Formato de timestamp de migration (para db-architect)
- Seeding command (para db-architect)
- API versioning strategy (para backend-dev)
- Tabela de módulos com status de cobertura (backend, frontend, types, README, swagger, tests)
