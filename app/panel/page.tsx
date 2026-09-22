import { EditorLinks } from '@/components/EditorLinks'
import { requerirCliente } from '@/lib/auth'
import type { ContactInfo, Link } from '@/lib/types'
import { EditorContacto } from '@/components/EditorContacto'
import { EditorPerfil } from './EditorPerfil'
import {
  actualizarLink,
  crearLink,
  eliminarLink,
  guardarContacto,
  moverLink,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function PaginaPanel() {
  const { supabase, profile } = await requerirCliente()

  const [{ data: links }, { data: contacto }] = await Promise.all([
    supabase
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })
      .returns<Link[]>(),
    supabase
      .from('contact_info')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle<ContactInfo>(),
  ])

  return (
    <>
      <h2>Mi página</h2>

      <EditorPerfil profile={profile} />

      <h2>Botones</h2>
      <EditorLinks
        profileId={profile.id}
        links={links ?? []}
        acciones={{
          crear: crearLink,
          actualizar: actualizarLink,
          eliminar: eliminarLink,
          mover: moverLink,
        }}
      />

      <h2>Contacto</h2>
      <EditorContacto contacto={contacto ?? null} guardar={guardarContacto} />

      <h2>Tu tarjeta física</h2>
      <div className="tarjeta">
        <p className="vacio" style={{ padding: 0 }}>
          El código grabado en tu tarjeta es <code>{profile.codigo_corto}</code> y lleva a{' '}
          <code>/{profile.slug}</code>. No lo cambies de lugar: si alguna vez mudamos el
          sitio de dirección, ese código sigue funcionando y tus tarjetas no se vuelven
          papel.
        </p>
        <p className="vacio" style={{ padding: 0, marginTop: '0.75rem' }}>
          ¿Necesitás más tarjetas o cambiar la dirección de tu página? Escribinos: esas
          dos cosas las hacemos nosotros.
        </p>
      </div>
    </>
  )
}
