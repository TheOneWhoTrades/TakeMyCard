import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requerirAdmin } from '@/lib/auth'
import type { Link as LinkPerfil, Profile } from '@/lib/types'
import { EditorLinks } from '../EditorLinks'
import { FormularioPerfil } from '../FormularioPerfil'
import { eliminarPerfil } from '../actions'

export const dynamic = 'force-dynamic'

export default async function PaginaEditarPerfil({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ creado?: string }>
}) {
  const { id } = await params
  const { creado } = await searchParams
  const { supabase } = await requerirAdmin()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle<Profile>()

  if (!profile) notFound()

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('profile_id', profile.id)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<LinkPerfil[]>()

  const { count: visitas } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id)

  return (
    <>
      <p>
        <Link href="/admin">← Volver al listado</Link>
      </p>

      {creado && <div className="mensaje mensaje--ok">Perfil creado. Ahora cargale los links.</div>}

      <div className="admin__barra" style={{ border: 0 }}>
        <h2 style={{ border: 0, margin: 0 }}>{profile.nombre}</h2>
        <div className="admin__acciones">
          <span className="pastilla">{visitas ?? 0} visitas</span>
          <a href={`/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn--mini">
            Ver página ↗
          </a>
        </div>
      </div>

      <FormularioPerfil profile={profile} />

      <EditorLinks profileId={profile.id} links={links ?? []} />

      <h2>Zona peligrosa</h2>
      <div className="tarjeta">
        <p className="vacio" style={{ padding: 0, marginBottom: '0.75rem' }}>
          Eliminar borra el perfil y todos sus links para siempre. Si la tarjeta física ya
          está entregada, conviene <strong>pausar</strong> en vez de eliminar: el slug queda
          reservado y la página muestra un aviso.
        </p>
        <form action={eliminarPerfil}>
          <input type="hidden" name="id" value={profile.id} />
          <button type="submit" className="btn btn--peligro">
            Eliminar perfil
          </button>
        </form>
      </div>
    </>
  )
}
