import Link from 'next/link'
import { Marca } from '@/components/Logo'
import { faltanDatosLegales, LEGAL, MARCA } from '@/lib/marca'

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

        {/*
          Si los datos del titular todavía no están cargados, el aviso sale en
          la página. Publicar una política de privacidad sin decir quién
          responde por los datos no sólo no protege: es exactamente lo que la
          Ley 25.326 exige informar, así que es peor que no tenerla.
        */}
        {faltanDatosLegales() && (
          <div className="mensaje mensaje--error">
            <strong>Borrador sin publicar.</strong> Faltan cargar los datos del titular
            (razón social, CUIT, domicilio y email de privacidad) en <code>lib/marca.ts</code>.
            Este documento no es válido hasta que estén completos.
          </div>
        )}

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
 * Muestra un dato legal, o un hueco marcado si todavía no se cargó.
 * Evita que el texto diga cosas como "domicilio: null".
 */
export function DatoLegal({ valor, que }: { valor: string | null; que: string }) {
  if (valor) return <>{valor}</>
  return <mark className="legal__pendiente">[completar {que}]</mark>
}
