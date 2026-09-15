import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

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
