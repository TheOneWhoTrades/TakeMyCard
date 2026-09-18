import Link from 'next/link'
import { linkWhatsapp, MARCA } from '@/lib/marca'

/**
 * Página de error específica para un slug fallido. No es el 404 genérico: quien
 * llega acá acaba de acercar una tarjeta física y necesita entender qué pasó.
 */
export function PerfilNoDisponible({
  estado,
  slug,
}: {
  estado: 'inactivo' | 'no_existe'
  slug: string
}) {
  const inactivo = estado === 'inactivo'

  return (
    <main className="aviso">
      <p className="aviso__emoji">{inactivo ? '⏸️' : '🔍'}</p>
      <h1 className="aviso__titulo">
        {inactivo ? 'Esta tarjeta está pausada' : 'No encontramos esta tarjeta'}
      </h1>
      <p className="aviso__texto">
        {inactivo
          ? 'El profesional dio de baja su página por el momento. Si te pasaron esta tarjeta hace poco, probá contactarlo por otro medio.'
          : (
            <>
              No existe ninguna página en la dirección <strong>/{slug}</strong>. Puede que
              esté mal escrita.
            </>
          )}
      </p>
      <p className="aviso__texto" style={{ marginTop: '1.5rem' }}>
        ¿Sos el titular de esta tarjeta? Escribinos y lo resolvemos.
      </p>
      <p style={{ marginTop: '2rem', display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          className="btn btn--primario"
          href={linkWhatsapp(
            `Hola! Acerqué una tarjeta de ${MARCA.nombre} a la dirección /${slug} y no funciona.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribirnos
        </a>
        <Link href="/" className="btn">
          Ir al inicio
        </Link>
      </p>
    </main>
  )
}
