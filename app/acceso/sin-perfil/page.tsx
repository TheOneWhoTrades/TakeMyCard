import Link from 'next/link'
import { cerrarSesionCliente } from '@/app/ingresar/actions'
import { linkWhatsapp, MENSAJES } from '@/lib/marca'

export const metadata = { title: 'Sin tarjeta asociada', robots: { index: false } }

/**
 * La sesión es válida pero ese email no está vinculado a ninguna tarjeta.
 * Pasa cuando alguien entra con un mail distinto del que nos dio al contratar,
 * que es el caso más común de soporte.
 */
export default function SinPerfil() {
  return (
    <main className="aviso">
      <p className="aviso__emoji">🗂️</p>
      <h1 className="aviso__titulo">Ese email no tiene una tarjeta asociada</h1>
      <p className="aviso__texto">
        Entraste bien, pero tu cuenta no está vinculada a ningún perfil. Suele pasar
        cuando el mail con el que ingresás no es el mismo que nos diste al contratar.
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
        <a
          className="btn btn--primario"
          href={linkWhatsapp(MENSAJES.general)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribirnos
        </a>
        <Link href="/" className="btn">
          Ir al inicio
        </Link>
      </p>
      <form action={cerrarSesionCliente} style={{ marginTop: '1.5rem' }}>
        <button type="submit" className="btn btn--mini">
          Salir y probar con otro email
        </button>
      </form>
    </main>
  )
}
