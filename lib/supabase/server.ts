import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 *
 * Usa siempre la anon key + la sesión del usuario en cookies, nunca la
 * service_role: así toda consulta sigue pasando por RLS y un bug en el panel
 * no puede convertirse en una fuga de datos de todos los clientes.
 */
export async function supabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Los Server Components no pueden escribir cookies. El refresco de
          // sesión lo hace el middleware, así que se puede ignorar.
        }
      },
    },
  })
}
