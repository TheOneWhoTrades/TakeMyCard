import Link from 'next/link'

export default function Home() {
  return (
    <main className="aviso">
      <p className="aviso__emoji">💳</p>
      <h1 className="aviso__titulo">TakeMyCard</h1>
      <p className="aviso__texto">
        Tarjetas personales con NFC para profesionales de San Luis.
      </p>
      <p className="aviso__texto">
        Cada tarjeta abre la página de su profesional. Si llegaste acá acercando una
        tarjeta, probá de nuevo: la URL debería incluir un nombre al final.
      </p>
      <p style={{ marginTop: '2rem' }}>
        <Link href="/login" className="btn">
          Acceso administradores
        </Link>
      </p>
    </main>
  )
}
