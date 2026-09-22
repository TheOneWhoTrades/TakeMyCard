import { supabasePublico } from '@/lib/supabase/public'

/**
 * Registro de vistas y clics del perfil público.
 *
 * ----------------------------------------------------------------------------
 * Lo que este endpoint NO hace, y es deliberado
 * ----------------------------------------------------------------------------
 * No lee ni guarda la IP del visitante. No lee ni guarda el user-agent. No
 * pone, lee ni necesita ninguna cookie. No genera un identificador de
 * dispositivo ni de sesión. No guarda la hora con más precisión que la que ya
 * tiene la fila. No hay huella digital de ningún tipo.
 *
 * La consecuencia es que no podemos ofrecer «visitantes únicos», sólo totales.
 * Es el precio de que la analítica del producto no vigile a nadie, y está
 * elegido así: el brief lo pide con todas las letras («Sin cookies ni datos
 * personales del visitante») y es lo que nos permite no pedir consentimiento
 * de cookies ni tratar datos personales de terceros.
 *
 * Del referrer se manda el valor crudo pero la base guarda sólo el dominio:
 * la normalización vive en el RPC `registrar_evento`, que es el único camino de
 * escritura a la tabla, así que vale también si el día de mañana alguien
 * escribe otro cliente.
 * ----------------------------------------------------------------------------
 *
 * Se usa POST con `navigator.sendBeacon` desde el navegador: la página del
 * profesional está cacheada en el borde, así que contar la visita en el render
 * del servidor devolvía una cota inferior (se contaba una vez por
 * regeneración, no una por visita).
 */

/** Sin caché: cada llamada tiene que llegar a la base. */
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9-]{3,50}$/

/** 204 sin cuerpo: el navegador no espera respuesta de un beacon. */
const ok = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return ok()
  }

  if (typeof cuerpo !== 'object' || cuerpo === null) return ok()
  const { slug, tipo, linkId, referrer } = cuerpo as Record<string, unknown>

  // Todo lo que no encaje se descarta en silencio. Un 400 no le sirve a nadie
  // --nadie lee la respuesta de un beacon-- y devolver detalle del error sólo
  // le facilitaría el trabajo a quien esté probando qué acepta el endpoint.
  if (typeof slug !== 'string' || !SLUG.test(slug)) return ok()
  if (tipo !== 'vista' && tipo !== 'clic') return ok()

  const link = typeof linkId === 'string' && UUID.test(linkId) ? linkId : null

  // Se recorta antes de mandarlo: el RPC se queda sólo con el host, pero no
  // hace falta que viaje una URL larga hasta la base para que la descarte.
  const origen =
    typeof referrer === 'string' && referrer.length > 0 ? referrer.slice(0, 300) : null

  try {
    await supabasePublico().rpc('registrar_evento', {
      p_slug: slug,
      p_tipo: tipo,
      p_link_id: link,
      p_referrer: origen,
    })
  } catch {
    // Si la analítica falla, falla sola. No es parte del producto que el
    // visitante vino a usar.
  }

  return ok()
}
