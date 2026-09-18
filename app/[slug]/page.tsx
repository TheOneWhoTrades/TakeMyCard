import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { after } from 'next/server'
import { BotonCopiar } from '@/components/BotonCopiar'
import { BotonGuardarContacto } from '@/components/BotonGuardarContacto'
import { IconoLink } from '@/components/IconoLink'
import { siteUrl } from '@/lib/env'
import { esFotoOptimizable } from '@/lib/imagen'
import { esExterno, hrefDeLink } from '@/lib/links'
import { obtenerPerfilPublico } from '@/lib/perfil'
import { supabasePublico } from '@/lib/supabase/public'
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

  if (resultado.estado !== 'activo') {
    return { title: 'Tarjeta no disponible', robots: { index: false } }
  }

  const { profile } = resultado
  const titulo = profile.profesion ? `${profile.nombre} · ${profile.profesion}` : profile.nombre
  const descripcion = profile.bio ?? `Contacto de ${profile.nombre}.`

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `${siteUrl()}/${profile.slug}` },
    openGraph: {
      type: 'profile',
      title: titulo,
      description: descripcion,
      url: `${siteUrl()}/${profile.slug}`,
      images: profile.foto_url ? [profile.foto_url] : undefined,
    },
  }
}

export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params
  const resultado = await obtenerPerfilPublico(slug)

  // Un slug inexistente o pausado sí se cachea, y está bien: la respuesta no va
  // a cambiar en el próximo minuto. El fallo de base no llega hasta acá, lo
  // toma el error.tsx de la ruta.
  if (resultado.estado !== 'activo') {
    return <PerfilNoDisponible estado={resultado.estado} slug={slug} />
  }

  const { profile, links } = resultado

  // Se registra después de mandar la respuesta: la visita nunca demora la página.
  // Ojo: la página se cachea, así que esto corre cuando se regenera, no en cada
  // visita: el conteo es una cota inferior. Se eligió así a propósito — que la
  // tarjeta abra rápido es el requisito del producto; la analítica no lo es.
  after(async () => {
    try {
      await supabasePublico().from('page_views').insert({ profile_id: profile.id })
    } catch {
      // La analítica no es prioridad: si falla, la página igual se sirvió bien.
    }
  })

  return (
    <main className="perfil">
      <header className="perfil__cabecera">
        {profile.foto_url ? (
          <Image
            className="perfil__foto"
            src={profile.foto_url}
            alt={`Foto de ${profile.nombre}`}
            width={112}
            height={112}
            priority
            unoptimized={!esFotoOptimizable(profile.foto_url)}
          />
        ) : (
          <div className="perfil__inicial" aria-hidden="true">
            {profile.nombre.trim().charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="perfil__nombre">{profile.nombre}</h1>
        {profile.profesion && <p className="perfil__profesion">{profile.profesion}</p>}
        {profile.bio && <p className="perfil__bio">{profile.bio}</p>}
      </header>

      <BotonGuardarContacto slug={profile.slug} nombre={profile.nombre} />

      {links.length > 0 && (
        <ul className="perfil__links">
          {links.map((link) => {
            const href = hrefDeLink(link)

            if (!href) {
              return (
                <li key={link.id}>
                  <BotonCopiar tipo={link.tipo} label={link.label} valor={link.valor} />
                </li>
              )
            }

            const externo = esExterno(href)

            return (
              <li key={link.id}>
                <a
                  className="boton"
                  href={href}
                  {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <IconoLink tipo={link.tipo} />
                  <span className="boton__texto">
                    <span className="boton__label">{link.label}</span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}

      <footer className="perfil__pie">
        <p>
          Tarjeta digital de {profile.nombre} ·{' '}
          {/* Cada visitante de una tarjeta es alguien que podría querer la suya:
              este link es la vía de entrada más barata que tiene el negocio. */}
          <Link href="/">TakeMyCard</Link>
        </p>
      </footer>
    </main>
  )
}
