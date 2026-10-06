#!/usr/bin/env bash
# Sonda del sitio: hace lo mismo que una tarjeta NFC y avisa si falla.
#
# Uso: scripts/sonda.sh https://take-my-card.vercel.app
#
# Pide /t/sonda-diaria, el mismo camino que recorre una tarjeta al apoyarla.
# Ese código no existe ni puede existir (los reales son 7 caracteres sin
# guiones), así que la respuesta esperada es la página "No encontramos esta
# tarjeta". Para llegar a esa respuesta el sitio tuvo que consultar la tabla de
# perfiles en Supabase, y eso es lo que importa:
#
#   · La consulta cuenta como actividad de la base. En el plan gratuito,
#     Supabase pausa el proyecto entero tras 7 días sin actividad, y con el
#     proyecto pausado ninguna tarjeta abre. Una consulta por día lo evita.
#   · Si algo está caído, este script termina con error, y GitHub le avisa por
#     mail a quien administra el repositorio.
#
# No registra visitas ni toca la analítica: /t/ no guarda eventos, y un código
# inexistente nunca llega a la página de un perfil.

set -euo pipefail

BASE="${1:?Falta la URL del sitio, por ejemplo https://take-my-card.vercel.app}"
URL="${BASE%/}/t/sonda-diaria"
CUERPO="$(mktemp)"
trap 'rm -f "$CUERPO"' EXIT

motivo=""
for intento in 1 2 3; do
  # Se vacía en cada intento: si curl falla sin escribir, no tiene que quedar
  # la respuesta del intento anterior y confundir el diagnóstico.
  : > "$CUERPO"
  # Si no hay conexión, curl ya imprime 000 como estado: alcanza con no dejar
  # que su error corte el script.
  estado="$(curl -sS --max-time 30 -o "$CUERPO" -w '%{http_code}' "$URL")" || true

  # Los dos textos salen de app/t/[codigo]/page.tsx: si se cambian allá, hay
  # que cambiarlos acá, o la sonda va a dar falsas alarmas.
  if [ "$estado" = "200" ] && grep -q "No encontramos esta tarjeta" "$CUERPO"; then
    echo "OK: el sitio respondió y la base de datos contestó la consulta."
    exit 0
  fi

  if grep -q "temporalmente indisponible" "$CUERPO" 2>/dev/null; then
    motivo="El sitio responde pero la base de datos no. Lo más probable: el proyecto de Supabase está pausado. Reactivarlo desde el panel de Supabase."
  else
    motivo="El sitio no respondió como se esperaba (HTTP $estado). Revisar Vercel."
  fi
  echo "Intento $intento de 3: $motivo"

  # Un arranque en frío de Vercel puede tardar: se reintenta antes de alarmar.
  if [ "$intento" -lt 3 ]; then sleep $((intento * 20)); fi
done

echo "::error::$motivo"
exit 1
