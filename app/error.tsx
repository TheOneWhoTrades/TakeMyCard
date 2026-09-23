'use client'

import Link from 'next/link'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Falla controlada para las rutas públicas. No lee la base: si Supabase está
 * temporalmente fuera de alcance, la tarjeta sigue mostrando un camino claro
 * para reintentar en vez de una pantalla técnica de Next.
 */
export default function ErrorGlobal({ error, reset }: Props) {
  console.error(error)

  return (
    <main className="aviso">
      <p className="aviso__emoji">⏳</p>
      <h1 className="aviso__titulo">No pudimos abrir esta página</h1>
      <p className="aviso__texto">
        Puede ser un problema temporal. Probá de nuevo en unos minutos.
      </p>
      <p
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '0.6rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button className="btn btn--primario" type="button" onClick={reset}>
          Reintentar
        </button>
        <Link href="/" className="btn">
          Ir al inicio
        </Link>
      </p>
    </main>
  )
}
