# syntax=docker/dockerfile:1.7
# ==============================================================================
# STAGE 0: Base - Define a imagem base com Node.js
# ==============================================================================
FROM node:20-slim AS base
ENV PNPM_HOME="/npm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ==============================================================================
# STAGE 1: Builder - Instala dependências e constrói TODAS as aplicações
# ==============================================================================
FROM base AS builder
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ARG SUPABASE_URL
ARG SUPABASE_KEY

# Define variáveis de ambiente para o build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_KEY=$SUPABASE_KEY

# Copia os arquivos de manifesto da raiz
COPY package.json package-lock.json turbo.json ./

# Copia somente manifestos dos workspaces
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Instala TODAS as dependências
RUN --mount=type=cache,id=npm-store,target=/npm/store \
    npm install --frozen-lockfile --legacy-peer-deps

# Copia o restante dos arquivos do projeto
COPY . .

# Executa o build de todas as aplicações via Turborepo
RUN npm run build

# ==============================================================================
# STAGE 2: Produção - Feitico API (NestJS)
# ==============================================================================
FROM base AS feitico-api
WORKDIR /app
ENV NODE_ENV=production

# Copia o monorepo inteiro já "buildado" do estágio anterior
COPY --from=builder /app .

WORKDIR /app/apps/api

EXPOSE 3333
CMD [ "node", "dist/main.js" ]

# ==============================================================================
# STAGE 3: Produção - Feitico Frontend (Vite)
# ==============================================================================
FROM node:20-slim AS feitico-web
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/dist ./dist

RUN npm install -g serve

EXPOSE 3000
CMD [ "serve", "-s", "dist", "-l", "3000" ]
