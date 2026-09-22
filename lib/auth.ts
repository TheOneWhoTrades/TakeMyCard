import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { CAPACIDADES, type Profile } from '@/lib/types'

/**
 * Exige una sesión de admin. La verificación real de permisos la hace RLS en la
 * base; esto es sólo para no renderizar un panel vacío y poder redirigir al
 * login con un mensaje entendible.
 */
export async function requerirAdmin() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) redirect('/login?error=no-admin')

  return { supabase, user }
}

/**
 * Exige una sesión de cliente con un perfil propio y plan que habilite la
 * autoedición (plus o premium).
 *
 * Igual que arriba: lo que de verdad impide que alguien edite un perfil ajeno
 * son las políticas de RLS. Acá se resuelve a qué perfil corresponde la sesión
 * y se dan mensajes distintos para cada caso, porque los tres son situaciones
 * reales y muy distintas entre sí:
 *
 *   · sin sesión              -> hay que ingresar;
 *   · sesión sin perfil       -> el mail no está vinculado a ninguna tarjeta;
 *   · perfil con plan básico  -> el panel es del Plus para arriba.
 */
export async function requerirCliente() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/ingresar?next=/panel')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<Profile>()

  // Estas dos rutas viven fuera de /panel a propósito: el layout del panel
  // vuelve a llamar a esta función, así que una página de "no tenés acceso"
  // dentro de /panel entraría en un bucle de redirecciones.
  if (!profile) redirect('/acceso/sin-perfil')
  if (!CAPACIDADES[profile.plan].autoEdicion) redirect('/acceso/sin-panel')

  return { supabase, user, profile }
}
