#!/usr/bin/env bash
# Levanta un Postgres efímero, aplica la migración y verifica que las políticas
# de Row Level Security hagan lo que dicen. No toca el proyecto Supabase real.
#
#   ./scripts/test-db.sh
#
# Requiere postgresql-16 instalado localmente (initdb, pg_ctl, psql).
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"

# Postgres se niega a correr como root. Si el script se ejecuta con sudo (o en
# un contenedor donde todo es root), se delega en el usuario `postgres`.
if [ "$(id -u)" -eq 0 ]; then
  id -u postgres >/dev/null 2>&1 || useradd -m postgres
  chmod 711 "$TMP"
  chown postgres:postgres "$TMP"
  COMO_PG=(su postgres -c)
else
  COMO_PG=(bash -c)
fi
PUERTO="${PGPORT:-54399}"
BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"

limpiar() {
  "${COMO_PG[@]}" "$BIN/pg_ctl -D $TMP/data stop -m immediate" >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap limpiar EXIT

"${COMO_PG[@]}" "$BIN/initdb -D $TMP/data -U postgres --auth=trust" >/dev/null
"${COMO_PG[@]}" "$BIN/pg_ctl -D $TMP/data -o '-p $PUERTO -k $TMP -c listen_addresses=' -l $TMP/pg.log start" >/dev/null

PSQL=(psql -h "$TMP" -p "$PUERTO" -U postgres -d tmc_test)

createdb -h "$TMP" -p "$PUERTO" -U postgres tmc_test
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 -f "$RAIZ/supabase/tests/00_shim_supabase.sql"
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 -f "$RAIZ"/supabase/migrations/*.sql
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 -f "$RAIZ/supabase/seed.sql"

echo "== Migración y seed aplicados. Probando RLS =="
# Los ERROR que aparecen acá son esperados: son los intentos de escritura que
# las políticas deben rechazar. Cada bloque dice qué se espera.
"${PSQL[@]}" -f "$RAIZ/supabase/tests/01_rls.sql"
