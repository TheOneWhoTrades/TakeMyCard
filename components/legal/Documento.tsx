import Link from 'next/link'
import { Marca } from '@/components/Logo'
import { estadoLegal, LEGAL, linkEmail, MARCA } from '@/lib/marca'

/**
 * Marco común de las tres páginas legales.
 *
 * Van con la misma estética de diario que el resto del sitio --no son un anexo
 * de letra chica-- y con el ancho de lectura corto, porque son textos que la
 * gente efectivamente lee cuando desconfía de algo.
 */
export function Documento({
  titulo,
  bajada,
  children,
}: {
  titulo: string
  bajada: string
  children: React.ReactNode
}) {
  return (
    <div className="sitio">
      <header className="masthead">
        <Link href="/" className="masthead__link">
          <Marca className="marca" />
        </Link>
        <p className="masthead__meta">
          {MARCA.provincia}
          <br />
          Est. 2026
        </p>
      </header>

      <article className="legal">
        <p className="volanta">Documentos</p>
        <h1 className="legal__titulo">{titulo}</h1>
        <p className="legal__bajada">{bajada}</p>
        <p className="legal__vigencia">
          Versión vigente desde el{' '}
          {new Date(`${LEGAL.vigenteDesde}T12:00:00Z`).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          .
        </p>
        <hr className="filete" />

        <AvisoDeEtapa />

        <div className="legal__cuerpo">{children}</div>

        <hr className="filete" />
        <nav className="legal__nav">
          <Link href="/privacidad">Política de privacidad</Link>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/cookies">Política de cookies</Link>
          <Link href="/">Volver al inicio</Link>
        </nav>
      </article>
    </div>
  )
}

/**
 * El aviso de arriba de todo, que cambia según en qué etapa está el proyecto.
 *
 * Son dos situaciones distintas y merecen dos tratamientos distintos:
 *
 *   · `piloto` — el proyecto está en prueba y todavía no vende. Decirlo es
 *     información verdadera y tranquilizadora, así que va como nota sobria.
 *     Un cartel de error acá asustaría al visitante de la tarjeta del cliente
 *     piloto sin motivo.
 *
 *   · `incompleto` — alguien apagó el modo piloto sin cargar los datos, es
 *     decir, salió a vender sin identificar al oferente. Eso sí es un problema,
 *     y el aviso rojo está para que no pase desapercibido.
 */
function AvisoDeEtapa() {
  const estado = estadoLegal()
  if (estado === 'completo') return null

  if (estado === 'piloto') {
    return (
      <div className="mensaje legal__etapa">
        <strong>Etapa de prueba.</strong> {MARCA.nombre} está en prueba piloto y todavía
        no comercializa el servicio. Los datos completos de identificación del responsable
        (razón social, CUIT y domicilio legal) se publican al lanzamiento comercial.
        Mientras tanto, el canal de contacto es{' '}
        <a href={linkEmail()}>{LEGAL.emailPrivacidad}</a>.
      </div>
    )
  }

  return (
    <div className="mensaje mensaje--error">
      <strong>Borrador sin publicar.</strong> Faltan cargar los datos del titular (razón
      social, CUIT y domicilio) en <code>lib/marca.ts</code>, y el modo piloto está
      apagado. Este documento no es válido hasta que estén completos.
    </div>
  )
}

/**
 * Muestra un dato legal, o un hueco marcado si todavía no se cargó.
 * Evita que el texto diga cosas como "domicilio: null".
 *
 * En etapa piloto los textos no llaman a este componente para la identidad del
 * responsable: usan un párrafo propio que explica la situación. Esto queda para
 * el email --que sí está cargado-- y para el día que se completen los demás.
 */
export function DatoLegal({ valor, que }: { valor: string | null; que: string }) {
  if (valor) return <>{valor}</>
  return <mark className="legal__pendiente">[completar {que}]</mark>
}

/** El email de contacto, siempre como enlace. */
export function EmailContacto({ asunto }: { asunto?: string }) {
  if (!LEGAL.emailPrivacidad) return <DatoLegal valor={null} que="el email de contacto" />
  return <a href={linkEmail(asunto)}>{LEGAL.emailPrivacidad}</a>
}
