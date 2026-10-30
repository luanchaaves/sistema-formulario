#!/bin/sh
set -e

echo "========================================================================="
echo "  FormFlow - Inicializando Container de Produção"
echo "========================================================================="

# Garante que o schema do banco de dados está sincronizado
if [ -n "$DATABASE_URL" ]; then
  echo "[FormFlow] Sincronizando schema do banco de dados PostgreSQL..."
  npx prisma db push --skip-generate --accept-data-loss || true
fi

echo "[FormFlow] Iniciando aplicação na porta ${PORT:-3004}..."
exec node server.js
