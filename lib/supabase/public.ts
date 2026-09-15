import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'

/**
 * Cliente para la página pública del profesional.
 *
 * A diferencia de `supabaseServer()`, no lee cookies: la página es anónima y no
 * hay sesión que mirar. Eso no es un detalle — usar `cookies()` marca la ruta
 * como dinámica y deshabilita el caché, y esta es justamente la página que
 * tiene que abrir instantáneo cuando alguien acerca la tarjeta al teléfono.
 *
 * Al no haber sesión, Supabase la trata como `anon`: RLS sólo devuelve perfiles
 * activos, que es exactamente lo que corresponde mostrar.
 */
export function supabasePublico() {
  return createClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
