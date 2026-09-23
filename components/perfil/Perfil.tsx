import Image from 'next/image'
import NextLink from 'next/link'
import { BotonCopiar } from '@/components/BotonCopiar'
import { BotonGuardarContacto } from '@/components/BotonGuardarContacto'
import { IconoLink } from '@/components/IconoLink'
import { RastreoPerfil } from '@/components/RastreoPerfil'
import { esFotoOptimizable } from '@/lib/imagen'
import { esExterno, hrefDeLink } from '@/lib/links'
import { MARCA } from '@/lib/marca'
import { obtenerPaleta, variablesDePaleta } from '@/lib/paletas'
import type { PerfilCompleto } from '@/lib/perfil'
import { CAPACIDADES } from '@/lib/types'

/**
 * La página del profesional, en sus cuatro variantes.
 *
 * El brief deja abierto «cuánto es diseño a medida y cuánto plantilla con
 * variantes» en el Premium, y la decisión tomada es: plantilla con variantes.
 * La razón es económica, no técnica — como el Premium cuesta apenas USD 5 y
 * USD 2/mes más que el Plus, casi todas las ventas van a ser Premium, así que
 * cada landing tiene que costar minutos y no días. Un componente por cliente no
 * escala a la primera decena de ventas.
 *
 * Las cuatro variantes comparten tipografía, paleta y contenido (contacto,
 * links, agenda: lo que cambia es el diseño, no el tipo de información, tal
 * como está definido). Lo que cambia entre ellas es la estructura:
 *
 *   · estandar  — columna centrada. La de Básico y Plus.
 *   · editorial — portada ancha, nombre como título de diario, links a dos
 *                 columnas. Para estudios y comercios.
 *   · retrato   — foto grande vertical al lado del texto. Para quien vende su
 *                 cara: abogados, contadores, salud.
 *   · vidriera  — portada como hero y links en grilla de fichas. Para quien
 *                 tiene varios servicios que mostrar.
 *
 * Agregar una quinta variante es agregar un valor al CHECK de la base, una
 * entrada en LAYOUTS y un bloque de CSS. Ese es el costo por diseño nuevo.
 */
export function Perfil({
  profile,
  links,
  contacto,
  medir = true,
}: PerfilCompleto & { medir?: boolean }) {
  const paleta = obtenerPaleta(profile.paleta)
  const capacidades = CAPACIDADES[profile.plan]

  // La portada es una función del plan, no del dato: un perfil que baja de Plus
  // a Básico deja de mostrarla sin que haya que borrar el archivo.
  const portada = capacidades.portada ? profile.portada_url : null

  // Sólo el Premium tiene layout propio. Si un perfil quedó con `layout`
  // cargado y después bajó de plan, vuelve al estándar solo.
  const layout = capacidades.landingPropia ? profile.layout : 'estandar'

  const conPortada = Boolean(portada)

  return (
    // El marco lleva la paleta y el fondo; la columna de adentro sólo maqueta.
    // Van separados porque el fondo tiene que cubrir la pantalla entera: si el
    // color viviera en la columna, en una pantalla ancha se vería una franja
    // del color del sitio a los costados del color que eligió el cliente.
    <div className="perfil-marco" style={variablesDePaleta(paleta)}>
      <main className={`perfil perfil--${layout}${conPortada ? ' perfil--con-portada' : ''}`}>
        {medir && <RastreoPerfil slug={profile.slug} />}

        {portada && (
          <div className="perfil__portada">
            <Image
              src={portada}
              alt=""
              /* Decorativa: el alt va vacío a propósito. Lo que describe a la
                 persona es la foto de perfil, que sí lo lleva. Un lector de
                 pantalla no gana nada anunciando "foto de portada". */
              fill
              sizes="(max-width: 46rem) 100vw, 46rem"
              priority
              className="perfil__portada-img"
              unoptimized={!esFotoOptimizable(portada)}
            />
          </div>
        )}

        <header className="perfil__cabecera">
          {profile.foto_url ? (
            <Image
              className="perfil__foto"
              src={profile.foto_url}
              alt={`Foto de ${profile.nombre}`}
              width={224}
              height={224}
              priority
              sizes="(max-width: 46rem) 40vw, 224px"
              unoptimized={!esFotoOptimizable(profile.foto_url)}
            />
          ) : (
            <div className="perfil__inicial" aria-hidden="true">
              {profile.nombre.trim().charAt(0).toUpperCase()}
            </div>
          )}

          <div className="perfil__identidad">
            <h1 className="perfil__nombre">{profile.nombre}</h1>
            {profile.profesion && <p className="perfil__profesion">{profile.profesion}</p>}
            {profile.bio && <p className="perfil__bio">{profile.bio}</p>}
          </div>
        </header>

        <BotonGuardarContacto slug={profile.slug} nombre={profile.nombre} />

        {links.length > 0 && (
          <ul className="perfil__links">
            {links.map((link) => {
              const href = hrefDeLink(link)

              if (!href) {
                return (
                  <li key={link.id}>
                    <BotonCopiar
                      id={link.id}
                      tipo={link.tipo}
                      label={link.label}
                      valor={link.valor}
                    />
                  </li>
                )
              }

              const externo = esExterno(href)

              return (
                <li key={link.id}>
                  <a
                    className="boton"
                    href={href}
                    /* Lo lee el listener delegado de RastreoPerfil. El enlace
                       sigue siendo un <a> normal: funciona sin JavaScript. */
                    data-link-id={link.id}
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

        {/* La dirección, cuando está cargada en los datos de contacto y no hay
            ya un botón de ubicación que la repita. */}
        {contacto?.direccion && !links.some((l) => l.tipo === 'ubicacion') && (
          <p className="perfil__direccion">{contacto.direccion}</p>
        )}

        <footer className="perfil__pie">
          <p>
            Tarjeta digital de {profile.nombre} ·{' '}
            {/* Cada visitante de una tarjeta es alguien que podría querer la
                suya: este link es la vía de entrada más barata del negocio. */}
            <NextLink href="/">{MARCA.nombre}</NextLink>
          </p>
          <p className="perfil__pie-legal">
            <NextLink href="/privacidad">Privacidad</NextLink>
            {' · '}
            <NextLink href="/terminos">Términos</NextLink>
            {' · '}
            <NextLink href="/cookies">Cookies</NextLink>
          </p>
        </footer>
      </main>
    </div>
  )
}
