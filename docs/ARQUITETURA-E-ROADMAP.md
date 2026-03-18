# Diagnostico tecnico e roadmap - Feitico

Data: 17/03/2026
Escopo: frontend Vite + Supabase + painel admin

## 1. Visao atual

- Aplicacao SPA com duas areas principais: landing publica e painel administrativo.
- Stack principal: React + TypeScript + Vite + Tailwind + React Query + Supabase.
- Padrao atual: hooks por dominio, componentes por area (landing/admin), tipagem parcial.

## 2. Objetivo de padrao (inspirado no seu template)

- Fortalecer arquitetura modular por dominio.
- Padronizar contratos e validacao (Zod).
- Reduzir acoplamento de regra de negocio em componentes.
- Melhorar seguranca, confiabilidade e observabilidade.

## 3. Gap principal

- Configuracao sensivel hardcoded (corrigido nesta fase inicial).
- Pouca separacao entre camada de apresentacao e regras complexas.
- Tipagem fragil em partes do admin (uso de any).
- Ausencia de documentacao arquitetural e guias operacionais.

## 4. Fases de evolucao

### Fase 0 - Hardening imediato

- Externalizar variaveis sensiveis para .env.
- Preparar .env.example.
- Remover hardcodes de ambiente no build/cache.
- Estabelecer documento de arquitetura e backlog tecnico.

Status: iniciado e aplicado.

### Fase 1 - Fundacao de arquitetura

- Criar camada de servicos por dominio em src/services:
  - bookingService
  - salonService
  - professionalService
- Manter hooks como adaptadores React Query (query/mutation only).
- Extrair schemas Zod para src/schemas por dominio.
- Eliminar any em componentes admin prioritarios.

### Fase 2 - Confiabilidade de agenda

- Fortalecer validacao de conflito de horario no lado servidor (Supabase/SQL).
- Padronizar mensagens de erro de agendamento.
- Cobrir calculo de horarios e normalizacao de telefone com testes.

### Fase 3 - Escalabilidade e qualidade

- Split por features (src/features/*) sem quebra de URL.
- Error boundary e padrao unico de tratamento de falhas.
- Suite minima de testes unitarios/integracao/e2e.

## 5. Convencoes recomendadas

- Um dominio por pasta em hooks/services/schemas.
- Evitar logica de negocio longa em componentes de tela.
- Toda entrada critica com validacao Zod.
- Todo acesso a dados passando por service de dominio.
- Evitar qualquer segredo hardcoded em codigo-fonte.

## 6. Prioridade de execucao sugerida

1. Fase 0 completa (concluida nesta entrega).
2. Fase 1 com foco em booking e salon.
3. Fase 2 para blindar conflitos e fluxo operacional.
4. Fase 3 para estabilidade de longo prazo.
