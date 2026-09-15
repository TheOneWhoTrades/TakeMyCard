import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="aviso">
      <p className="aviso__emoji">🔍</p>
      <h1 className="aviso__titulo">No encontramos esta página</h1>
      <p className="aviso__texto">
        La dirección que abriste no corresponde a ningún profesional.
      </p>
      <p style={{ marginTop: '2rem' }}>
        <Link href="/" className="btn">
          Volver al inicio
        </Link>
      </p>
    </main>
  )
}
