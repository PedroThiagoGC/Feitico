# Agents Kit v3

8 core Claude agents plus project specialists for Feitico. One `PROJECT-CONTEXT.md` configures all of them for the active repo.

---

## Estrutura

```
agents-kit/
|-- README.md
|-- PROJECT-CONTEXT.md
`-- agents/
    |-- architect.md
    |-- backend-dev.md
    |-- frontend-dev.md
    |-- code-reviewer.md
    |-- test-writer.md
    |-- types-manager.md
    |-- db-architect.md
    |-- doc-writer.md
    |-- tech-leader.md
    |-- landing-specialist.md
    |-- booking-specialist.md
    |-- admin-specialist.md
    |-- financial-specialist.md
    |-- client-crm-specialist.md
    |-- notifications-pwa-specialist.md
    `-- supabase-governance-specialist.md
```

---

## Agentes Core

| Situacao | Agente |
|----------|--------|
| Decisao afeta 3+ modulos, nova arquitetura, ADR | `architect` |
| Novo service, mutation, infra backend-like, hook contract | `backend-dev` |
| Novo componente, pagina, form, UX, hook UI | `frontend-dev` |
| Revisao de codigo, pre-merge | `code-reviewer` |
| Testes para codigo novo ou bug fix | `test-writer` |
| Novo schema Zod, tipo derivado, contratos | `types-manager` |
| Nova migration, indice, trigger, query SQL | `db-architect` |
| README, JSDoc, changelog, ADR | `doc-writer` |
| Direcao tecnica e sequenciamento | `tech-leader` |

## Especialistas por Aspecto do Feitico

| Aspecto | Agente |
|--------|--------|
| Landing publica, copy dinamica, SEO, conversao | `landing-specialist` |
| Booking, slots, conflitos, WhatsApp, snapshot do cliente | `booking-specialist` |
| Painel `/admin`, tabelas, filtros, paginacao, UX operacional | `admin-specialist` |
| Comissoes, repasses, lucratividade e dashboard financeiro | `financial-specialist` |
| Clientes, telefone, aliases, recorrencia e LGPD | `client-crm-specialist` |
| Push, lembretes, service worker e fallback PWA | `notifications-pwa-specialist` |
| RLS, policies, realtime, storage e drift dos tipos gerados | `supabase-governance-specialist` |

## Fluxo recomendado

```
Nova feature vertical do produto
  tech-leader -> especialista de aspecto -> core support agents -> test-writer -> doc-writer

Refatoracao tecnica local
  especialista de aspecto -> backend-dev/frontend-dev -> code-reviewer -> test-writer

Mudanca em RLS, trigger ou schema com impacto no app
  supabase-governance-specialist -> db-architect -> backend-dev/frontend-dev
```
