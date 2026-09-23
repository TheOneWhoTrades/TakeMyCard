import type { Metadata } from 'next'
import { Perfil } from '@/components/perfil/Perfil'
import { DEMO_PUBLICA, esDemoPublica } from '@/lib/demo'
import { siteUrl } from '@/lib/env'
import { obtenerPerfilPublico } from '@/lib/perfil'
import { CAPACIDADES } from '@/lib/types'
import { PerfilNoDisponible } from './no-disponible'

// El contenido lo administramos nosotros y cambia poco. Se cachea 60 segundos:
// la tarjeta abre instantáneo y una corrección en el panel se ve al minuto.
export const revalidate = 60

// Sin esto la ruta se sirve dinámica y `revalidate` no tiene efecto: Next sólo
// cachea un segmento dinámico si el archivo declara `generateStaticParams`.
// Devolvemos una lista vacía a propósito — no queremos prerenderizar perfiles en
// el build (cambian desde el panel), sólo que se cacheen al generarse.
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // Un throw acá no lo atrapa el error.tsx de la ruta: `generateMetadata` corre
  // antes del render y el fallo sale como un 500 pelado. Se devuelven metadatos
  // neutros y se deja que el componente de la página lance, que es quien sí
  // tiene boundary.
  let resultado
  try {
    resultado = await obtenerPerfilPublico(slug)
  } catch {
    return { title: 'Tarjeta no disponible', robots: { index: false } }
  }

  let profile
  if (resultado.estado !== 'activo') {
    if (!esDemoPublica(slug)) {
      return { title: 'Tarjeta no disponible', robots: { index: false } }
    }
    profile = DEMO_PUBLICA.profile
  } else {
    profile = resultado.profile
  }
  const titulo = profile.profesion ? `${profile.nombre} · ${profile.profesion}` : profile.nombre
  const descripcion = profile.bio ?? `Contacto de ${profile.nombre}.`

  // Para compartir se prefiere la portada: es apaisada, que es la forma que
  // piden WhatsApp y las redes. La foto de perfil es cuadrada y sale recortada.
  const imagenes = [
    CAPACIDADES[profile.plan].portada ? profile.portada_url : null,
    profile.foto_url,
  ].filter((url): url is string => Boolean(url))

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `${siteUrl()}/${profile.slug}` },
    openGraph: {
      type: 'profile',
      title: titulo,
      description: descripcion,
      url: `${siteUrl()}/${profile.slug}`,
      images: imagenes.length ? imagenes : undefined,
    },
    twitter: {
      card: imagenes.length ? 'summary_large_image' : 'summary',
      title: titulo,
      description: descripcion,
    },
  }
}

export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params
  const resultado = await obtenerPerfilPublico(slug)

  // Un slug inexistente o pausado sí se cachea, y está bien: la respuesta no va
  // a cambiar en el próximo minuto. El fallo de base no llega hasta acá, lo
  // toma el error.tsx de la ruta.
  if (resultado.estado !== 'activo' && esDemoPublica(slug)) {
    return <Perfil {...DEMO_PUBLICA} medir={false} />
  }

  if (resultado.estado !== 'activo') {
    return <PerfilNoDisponible estado={resultado.estado} slug={slug} />
  }

  // La visita se cuenta desde el navegador (ver components/RastreoPerfil.tsx).
  // Contarla acá daba una cota inferior: esta página está cacheada, así que el
  // render ocurre una vez por regeneración, no una por visita.
  return (
    <Perfil
      profile={resultado.profile}
      links={resultado.links}
      contacto={resultado.contacto}
    />
  )
}
