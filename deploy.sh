#!/bin/bash

# Para o script se qualquer comando falhar
set -euo pipefail

# Função de ajuda
show_help() {
    echo "Uso: ./deploy.sh <ambiente> [tag]"
    echo "Ambientes disponíveis: prod (production), dev (development)"
    echo "Exemplo: ./deploy.sh dev"
    echo "Exemplo: ./deploy.sh prod v1.0.0"
}

# Verifica se o primeiro argumento foi fornecido
if [ -z "$1" ]; then
    echo "ERRO: Ambiente não especificado."
    show_help
    exit 1
fi

ENVIRONMENT=$1
TAG_ARG=$2

# --- CONFIGURAÇÃO DO AMBIENTE ---
if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "production" ]]; then
    ENV_FILE=".env.production"
    STACK_NAME="feitico-prod"
    ENV_SUFFIX="-prod"
elif [[ "$ENVIRONMENT" == "dev" || "$ENVIRONMENT" == "development" ]]; then
    ENV_FILE=".env.development"
    STACK_NAME="feitico-dev"
    ENV_SUFFIX="-dev"
else
    echo "ERRO: Ambiente '$ENVIRONMENT' desconhecido."
    show_help
    exit 1
fi

echo ">>> Ambiente selecionado: $ENVIRONMENT"
echo ">>> Usando arquivo de configuração: $ENV_FILE"
echo ">>> Nome da Stack: $STACK_NAME"

export STACK_NAME

# Carrega as variáveis do arquivo .env específico
if [ ! -f "$ENV_FILE" ]; then
    echo "ERRO: Arquivo $ENV_FILE não encontrado!"
    exit 1
fi

set -o allexport
source "$ENV_FILE"
set +o allexport

STACK_FILE="${STACK_FILE:-feitico.yaml}"

require_env() {
    local name="$1"
    if [ -z "${!name:-}" ]; then
        echo "ERRO: Variável obrigatória '$name' não está definida em $ENV_FILE"
        exit 1
    fi
}

require_env "REGISTRY"
require_env "DOMAIN"
require_env "NODE_ENV"
require_env "VITE_API_URL"
require_env "VITE_SUPABASE_URL"

if [ -z "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
    if [ -n "${VITE_SUPABASE_KEY:-}" ]; then
        VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_KEY"
    else
        echo "ERRO: Defina VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_KEY para compatibilidade) em $ENV_FILE"
        exit 1
    fi
fi

require_env "SUPABASE_URL"
require_env "SUPABASE_SERVICE_ROLE_KEY"
require_env "JWT_SECRET"
require_env "FRONTEND_URL"

if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
    if [ -n "${SUPABASE_KEY:-}" ]; then
        SUPABASE_ANON_KEY="$SUPABASE_KEY"
    else
        echo "ERRO: Defina SUPABASE_ANON_KEY (ou SUPABASE_KEY para compatibilidade) em $ENV_FILE"
        exit 1
    fi
fi

export VITE_SUPABASE_PUBLISHABLE_KEY
export SUPABASE_ANON_KEY

# --- DEFINIÇÃO DA TAG ---
if [ -z "$TAG_ARG" ]; then
  # Se nenhuma tag for passada, gera uma baseada no commit + ambiente
  GIT_HASH=$(git rev-parse --short HEAD)
  IMAGE_TAG="${GIT_HASH}${ENV_SUFFIX}"
  DO_BUILD=true
  echo ">>> Nenhuma tag especificada. Gerando nova tag: $IMAGE_TAG"
else
  # Se uma tag for passada, usamos ela diretamente
  IMAGE_TAG="$TAG_ARG"
  DO_BUILD=false
  echo ">>> Usando a tag especificada para deploy/rollback: $IMAGE_TAG"
fi

export IMAGE_TAG

discover_images_from_stack() {
    envsubst < "$STACK_FILE" | \
    awk '
        match($0, /^[[:space:]]*image:[[:space:]]*([^[:space:]]+)[[:space:]]*$/, m) {
            print m[1]
        }
    ' | \
    while IFS= read -r IMAGE_WITH_TAG; do
        IMAGE_WITHOUT_TAG="${IMAGE_WITH_TAG%:$IMAGE_TAG}"
        if [ "$IMAGE_WITHOUT_TAG" != "$IMAGE_WITH_TAG" ]; then
            printf '%s\n' "$IMAGE_WITHOUT_TAG" | tr '[:upper:]' '[:lower:]'
        fi
    done | sort -u
}

discover_service_keys_from_stack() {
    awk '
        /^services:[[:space:]]*$/ { in_services=1; next }
        in_services && /^[^[:space:]]/ { in_services=0 }
        in_services && match($0, /^[[:space:]]{2}([a-zA-Z0-9._-]+):[[:space:]]*$/, m) {
            print m[1]
        }
    ' "$STACK_FILE"
}

wait_for_remote_image() {
    local image_ref="$1"
    local attempts="${2:-6}"
    local sleep_seconds="${3:-5}"
    local attempt=1

    while [ "$attempt" -le "$attempts" ]; do
        if docker manifest inspect "$image_ref" > /dev/null 2>&1; then
            return 0
        fi

        if [ "$attempt" -lt "$attempts" ]; then
            echo ">>> Manifest ainda indisponível para $image_ref. Nova tentativa em ${sleep_seconds}s (${attempt}/${attempts})..."
            sleep "$sleep_seconds"
        fi

        attempt=$((attempt + 1))
    done

    return 1
}

validate_image_exists() {
    local image_ref="$1"

    if docker image inspect "$image_ref" > /dev/null 2>&1; then
        return 0
    fi

    if wait_for_remote_image "$image_ref"; then
        return 0
    fi

    return 1
}

ensure_buildx_builder() {
    if ! docker buildx version >/dev/null 2>&1; then
        return 1
    fi

    if ! docker buildx inspect feitico-builder >/dev/null 2>&1; then
        docker buildx create --name feitico-builder --driver docker-container --use >/dev/null
    else
        docker buildx use feitico-builder >/dev/null
    fi

    docker buildx inspect --bootstrap >/dev/null
}

build_with_bake() {
    local CACHE_DIR=".buildx-cache"
    local CACHE_DIR_NEW=".buildx-cache-new"
    local CACHE_DIR_OLD=".buildx-cache-old"
    local BAKE_FILE
    BAKE_FILE=$(mktemp)

    mapfile -t IMAGES < <(discover_images_from_stack)

    if [ ${#IMAGES[@]} -eq 0 ]; then
        echo "ERRO: Nenhuma imagem com \${IMAGE_TAG} encontrada em $STACK_FILE"
        rm -f "$BAKE_FILE"
        exit 1
    fi

    local GROUP_TARGETS=""
    {
        echo 'group "default" {'
        echo '  targets = ['
        for IMAGE_NAME in "${IMAGES[@]}"; do
            STAGE_NAME="${IMAGE_NAME##*/}"
            GROUP_TARGETS+="\"$STAGE_NAME\","
        done
        GROUP_TARGETS="${GROUP_TARGETS%,}"
        echo "    ${GROUP_TARGETS}"
        echo '  ]'
        echo '}'
        echo

        for IMAGE_NAME in "${IMAGES[@]}"; do
            STAGE_NAME="${IMAGE_NAME##*/}"
            echo "target \"$STAGE_NAME\" {"
            echo '  context = "."'
            echo '  dockerfile = "Dockerfile"'
            echo "  target = \"$STAGE_NAME\""
            echo "  tags = [\"$IMAGE_NAME:$IMAGE_TAG\"]"
            echo '}'
            echo
        done
    } > "$BAKE_FILE"

    mkdir -p "$CACHE_DIR"
    rm -rf "$CACHE_DIR_NEW"

    local -a BAKE_CMD
    BAKE_CMD=(
        docker buildx bake
        --file "$BAKE_FILE"
        --push
        --progress=plain
        --set "*.args.VITE_API_URL=$VITE_API_URL"
        --set "*.args.VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
        --set "*.args.VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY"
        --set "*.args.SUPABASE_URL=$SUPABASE_URL"
        --set "*.args.SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
        --set "*.cache-to=type=local,dest=$CACHE_DIR_NEW,mode=max,ignore-error=true"
    )

    if [ -f "$CACHE_DIR/index.json" ]; then
        BAKE_CMD+=(--set "*.cache-from=type=local,src=$CACHE_DIR")
    fi

    if ! "${BAKE_CMD[@]}"; then
        echo ">>> Aviso: buildx bake com cache local falhou. Tentando novamente sem cache local..."
        rm -rf "$CACHE_DIR_NEW"

        local -a BAKE_CMD_NO_CACHE
        BAKE_CMD_NO_CACHE=(
            docker buildx bake
            --file "$BAKE_FILE"
            --push
            --progress=plain
            --set "*.args.VITE_API_URL=$VITE_API_URL"
            --set "*.args.VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
            --set "*.args.VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY"
            --set "*.args.SUPABASE_URL=$SUPABASE_URL"
            --set "*.args.SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
        )

        "${BAKE_CMD_NO_CACHE[@]}"
    fi

    rm -rf "$CACHE_DIR_OLD"
    if [ -d "$CACHE_DIR" ]; then
        mv "$CACHE_DIR" "$CACHE_DIR_OLD"
    fi
    if [ -d "$CACHE_DIR_NEW" ]; then
        mv "$CACHE_DIR_NEW" "$CACHE_DIR"
    fi
    rm -rf "$CACHE_DIR_OLD"
    rm -f "$BAKE_FILE"
}

build_with_classic_docker() {
    mapfile -t IMAGES < <(discover_images_from_stack)

    if [ ${#IMAGES[@]} -eq 0 ]; then
        echo "ERRO: Nenhuma imagem com \${IMAGE_TAG} encontrada em $STACK_FILE"
        exit 1
    fi

    for IMAGE_NAME in "${IMAGES[@]}"; do
        STAGE_NAME="${IMAGE_NAME##*/}"
        echo ">>> Gerando imagem $IMAGE_NAME:$IMAGE_TAG (target: $STAGE_NAME)..."
        docker build \
            --build-arg VITE_API_URL="$VITE_API_URL" \
            --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
            --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
            --build-arg SUPABASE_URL="$SUPABASE_URL" \
            --build-arg SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
            --target "$STAGE_NAME" \
            -t "$IMAGE_NAME:$IMAGE_TAG" \
            .
    done
}

# --- ETAPA DE BUILD ---
if [ "$DO_BUILD" = true ]; then
    echo "============================================================"
    echo "Iniciando build para a tag: $IMAGE_TAG"
    echo "Ambiente: $NODE_ENV"
    echo "============================================================"

    # Função para lidar com falhas de build
    handle_build_failure() {
        echo "============================================================"
        echo "ERRO: Build falhou!"
        echo "A aplicação em $ENVIRONMENT NÃO foi afetada."
        echo "============================================================"
        exit 1
    }

    trap 'handle_build_failure' ERR

    export DOCKER_BUILDKIT=1
    
    echo ">>> Construindo imagens..."

    if ensure_buildx_builder; then
        echo ">>> BuildKit buildx disponível. Executando build com bake e cache persistente..."
        build_with_bake
    else
        echo ">>> buildx não disponível. Usando fallback com docker build clássico (sequencial)."
        build_with_classic_docker
    fi

    echo ">>> Build concluído com sucesso!"
else
    echo ">>> Pulando etapa de build (Tag fornecida explicitamente)."
fi

# --- VALIDAÇÃO DE IMAGENS ---
echo ">>> Validando imagens..."
mapfile -t IMAGES < <(discover_images_from_stack)

if [ ${#IMAGES[@]} -eq 0 ]; then
    echo "ERRO: Nenhuma imagem com \${IMAGE_TAG} encontrada em $STACK_FILE"
    exit 1
fi

for IMAGE_NAME in "${IMAGES[@]}"; do
    IMAGE_REF="$IMAGE_NAME:$IMAGE_TAG"

    if ! validate_image_exists "$IMAGE_REF"; then
        echo "ERRO: Imagem $IMAGE_REF não encontrada localmente nem no registry após as tentativas de validação."
        exit 1
    fi
done

# --- BACKUP DA TAG ATUAL (INFORMACIONAL) ---
mapfile -t SERVICES < <(discover_service_keys_from_stack)
REFERENCE_SERVICE="${SERVICES[0]}"

if [ -z "$REFERENCE_SERVICE" ]; then
    REFERENCE_IMAGE="${IMAGES[0]}"
    REFERENCE_SERVICE="${REFERENCE_IMAGE##*/}"
fi

SERVICE_NAME_REFERENCE="${STACK_NAME}_${REFERENCE_SERVICE}"
echo ">>> Verificando versão atual no serviço $SERVICE_NAME_REFERENCE..."

if docker service inspect "$SERVICE_NAME_REFERENCE" >/dev/null 2>&1; then
    CURRENT_TAG=$(docker service inspect "$SERVICE_NAME_REFERENCE" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null | awk -F: '{print $NF}' || echo "none")
else
    CURRENT_TAG="none"
fi

echo ">>> Versão atual rodando: $CURRENT_TAG"

# --- ETAPA DE DEPLOY ---
echo ">>> Deploying stack '$STACK_NAME' com tag '$IMAGE_TAG'..."

if envsubst < "$STACK_FILE" | docker stack deploy --with-registry-auth -c - "$STACK_NAME"; then
    echo "============================================================"
    echo "Deploy concluído com sucesso no ambiente: $ENVIRONMENT"
    echo "Tag implantada: $IMAGE_TAG"
    echo "============================================================"
else
    echo "============================================================"
    echo "ERRO: Deploy falhou!"
    echo "============================================================"
    exit 1
fi
