#!/bin/sh
set -e

echo "[Dictadle Backend] Aguardando disponibilidade do banco de dados e aplicando migrações..."

MAX_RETRIES=${DB_MAX_RETRIES:-15}
RETRY_INTERVAL=${DB_RETRY_INTERVAL:-2}
COUNT=0

until flask db upgrade; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
        echo "[Dictadle Backend] ERRO: Falha ao aplicar migrações (flask db upgrade) após $MAX_RETRIES tentativas."
        exit 1
    fi
    echo "[Dictadle Backend] Banco ainda não disponível (tentativa $COUNT/$MAX_RETRIES). Aguardando ${RETRY_INTERVAL}s..."
    sleep "$RETRY_INTERVAL"
done

echo "[Dictadle Backend] Migrações aplicadas com sucesso!"

if [ "${SEED_ADMIN_ON_BOOT:-true}" = "true" ]; then
    echo "[Dictadle Backend] Garantindo conta administrativa inicial (seed-admin)..."
    flask seed-admin \
        --username "${ADMIN_USERNAME:-admin}" \
        --email "${ADMIN_EMAIL:-admin@dictadle.com}" \
        --password "${ADMIN_PASSWORD:-Admin12345}" || true
fi

echo "[Dictadle Backend] Iniciando servidor WSGI..."
exec "$@"
