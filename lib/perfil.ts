import { cache } from 'react'
import { supabasePublico } from '@/lib/supabase/public'
import type { ContactInfo, Link, Profile } from '@/lib/types'

export type PerfilCompleto = {
  profile: Profile
  links: Link[]
  contacto: ContactInfo | null
}

export type ResultadoPerfil =
  | ({ estado: 'activo' } & PerfilCompleto)
  | { estado: 'inactivo' | 'no_existe' }

/**
 * Busca un perfil público por slug junto con sus links y sus datos de contacto.
 *
 * RLS sólo devuelve perfiles activos, así que un perfil dado de baja y un slug
 * inexistente son indistinguibles en la consulta. Para poder mostrar el mensaje
 * de error correcto se consulta después el RPC `estado_slug`, que devuelve el
 * estado sin exponer los datos de la fila.
 *
 * Va envuelto en `cache()` de React: `generateMetadata` y el componente de la
 * página piden el mismo perfil, y sin memoizar serían dos consultas por render.
 *
 * Si la base no contesta, esto LANZA en vez de devolver un estado. Es a
 * propósito: la página se cachea por 60 segundos, y un resultado devuelto se
 * cachearía igual que uno bueno, dejando la tarjeta rota un minuto después de
 * que el servicio se recupere. Un render que falla no se cachea, y el
 * `error.tsx` de la ruta muestra el aviso.
 */
export const obtenerPerfilPublico = cache(async (slug: string): Promise<ResultadoPerfil> => {
  const supabase = supabasePublico()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<Profile>()

  // Distinto de "no hay fila": acá la base no contestó. Decirle "no existe" al
  // visitante sería mentirle sobre una tarjeta que está perfectamente bien.
  if (error) throw new Error(`No se pudo consultar el perfil "${slug}": ${error.message}`)

  if (!profile) {
    const { data: estado, error: errorEstado } = await supabase.rpc('estado_slug', { p_slug: slug })
    if (errorEstado) {
      throw new Error(`No se pudo consultar el estado del perfil "${slug}": ${errorEstado.message}`)
    }
    return { estado: estado === 'inactivo' ? 'inactivo' : 'no_existe' }
  }

  // Los dos pedidos que faltan no dependen entre sí: van juntos para no sumar
  // dos viajes en serie a una página que tiene que abrir apenas se apoya la
  // tarjeta en el teléfono.
  const [{ data: links, error: errorLinks }, { data: contacto, error: errorContacto }] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })
      .returns<Link[]>(),
    supabase
      .from('contact_info')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle<ContactInfo>(),
  ])

  if (errorLinks) throw new Error(`No se pudieron consultar los links del perfil: ${errorLinks.message}`)
  if (errorContacto) {
    throw new Error(`No se pudo consultar el contacto del perfil: ${errorContacto.message}`)
  }

  return { estado: 'activo', profile, links: links ?? [], contacto: contacto ?? null }
})
