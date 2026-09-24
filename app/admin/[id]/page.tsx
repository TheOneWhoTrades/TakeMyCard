import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorContacto } from '@/components/EditorContacto'
import { EditorLinks } from '@/components/EditorLinks'
import { Metricas, periodoValido } from '@/components/Metricas'
import { requerirAdmin } from '@/lib/auth'
import { siteUrl } from '@/lib/env'
import {
  CAPACIDADES,
  type Card,
  type ContactInfo,
  type Link as LinkPerfil,
  type Metrica,
  type Profile,
} from '@/lib/types'
import { EditorTarjetas } from '../EditorTarjetas'
import { EliminarPerfil } from '../EliminarPerfil'
import { FormularioPerfil } from '../FormularioPerfil'
import { VincularCuenta } from '../VincularCuenta'
import {
  actualizarLink,
  crearLink,
  eliminarLink,
  guardarContacto,
  moverLink,
} from '../actions'

export const dynamic = 'force-dynamic'

export default async function PaginaEditarPerfil({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ creado?: string; dias?: string }>
}) {
  const { id } = await params
  const { creado, dias: diasParam } = await searchParams
  const { supabase } = await requerirAdmin()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle<Profile>()

  if (!profile) notFound()

  const dias = periodoValido(diasParam)

  const [{ data: links }, { data: contacto }, { data: cards }, { data: metricas }] =
    await Promise.all([
      supabase
        .from('links')
        .select('*')
        .eq('profile_id', profile.id)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true })
        .returns<LinkPerfil[]>(),
      supabase
        .from('contact_info')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle<ContactInfo>(),
      supabase
        .from('cards')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true })
        .returns<Card[]>(),
      supabase.rpc('metricas_perfil', { p_profile_id: profile.id, p_dias: dias }),
    ])

  const tieneTarjetasRegistradas = (cards?.length ?? 0) > 0

  return (
    <>
      <p>
        <Link href="/admin">← Volver al listado</Link>
      </p>

      {creado && (
        <div className="mensaje mensaje--ok">
          Perfil creado. Ahora cargale las fotos y los botones.
        </div>
      )}

      <div className="admin__barra" style={{ border: 0 }}>
        <h2 style={{ border: 0, margin: 0 }}>{profile.nombre}</h2>
        <div className="admin__acciones">
          <span className={`pastilla pastilla--${profile.plan}`}>{profile.plan}</span>
          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--mini"
          >
            Ver página ↗
          </a>
        </div>
      </div>

      {/* El código corto es lo que se graba en el chip. Se muestra arriba de
          todo porque es el dato que hace falta a la hora de programar la
          tarjeta, que es cuando se abre esta pantalla. */}
      <div className="tarjeta">
        <h3>Qué grabar en el chip</h3>
        <p className="codigo-chip">
          {siteUrl()}/t/{profile.codigo_corto}
        </p>
        <p className="vacio" style={{ padding: 0 }}>
          No grabes <code>/{profile.slug}</code> directo: el código corto es lo que nos
          deja cambiar de dominio o de slug sin romper las tarjetas ya entregadas.
        </p>
      </div>

      <FormularioPerfil profile={profile} />

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
      <EditorContacto
        contacto={contacto ?? null}
        guardar={guardarContacto}
        profileId={profile.id}
      />

      <h2>Acceso del cliente</h2>
      <VincularCuenta profileId={profile.id} vinculada={Boolean(profile.user_id)} />

      <h2>Tarjetas físicas</h2>
      <EditorTarjetas profileId={profile.id} cards={cards ?? []} />

      <h2>Estadísticas</h2>
      <p className="vacio" style={{ padding: 0, marginBottom: '1rem' }}>
        Los eventos se registran en todos los planes.{' '}
        {CAPACIDADES[profile.plan].analytics
          ? 'Este cliente también las ve desde su panel.'
          : 'Este cliente no las ve: el panel de estadísticas es del Premium. Si sube de plan, tiene el historial desde el día uno.'}
      </p>
      <Metricas
        metricas={(metricas as Metrica[] | null) ?? []}
        dias={dias}
        base={`/admin/${profile.id}`}
      />

      <h2>Zona peligrosa</h2>
      <div className="tarjeta">
        <p className="vacio" style={{ padding: 0, marginBottom: '0.75rem' }}>
          {tieneTarjetasRegistradas ? (
            <>
              Este perfil tiene tarjetas físicas registradas y no se puede eliminar. Para que
              dejen de mostrar el contenido, <strong>pausalo</strong>: la dirección NFC queda
              reservada y muestra un aviso.
            </>
          ) : (
            <>
              Eliminar borra el perfil, sus links, sus datos de contacto y sus estadísticas,
              para siempre. Usalo sólo para un alta creada por error antes de programar o
              registrar tarjetas físicas.
            </>
          )}
        </p>
        {!tieneTarjetasRegistradas && <EliminarPerfil profileId={profile.id} />}
      </div>
    </>
  )
}
