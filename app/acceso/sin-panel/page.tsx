import Link from 'next/link'
import { cerrarSesionCliente } from '@/app/ingresar/actions'
import { linkWhatsapp, MENSAJES } from '@/lib/marca'

export const metadata = { title: 'Tu plan no incluye panel', robots: { index: false } }

/**
 * Perfil válido, pero plan Básico: el panel de autoedición es del Plus para
 * arriba. Es el corte principal entre planes, así que el mensaje explica la
 * alternativa en vez de limitarse a negar el acceso.
 */
export default function SinPanel() {
  return (
    <main className="aviso">
      <p className="aviso__emoji">✍️</p>
      <h1 className="aviso__titulo">Tu plan no incluye panel de autoedición</h1>
      <p className="aviso__texto">
        Con el plan Básico los cambios los hacemos nosotros: escribinos qué querés
        corregir y lo actualizamos. Tu página se actualiza al toque y las tarjetas que ya
        repartiste siguen apuntando al lugar correcto.
      </p>
      <p className="aviso__texto" style={{ marginTop: '1.5rem' }}>
        Si querés editarla vos mismo, el plan Plus lo incluye.
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
          href={linkWhatsapp(MENSAJES.plan('Plus'))}
          target="_blank"
          rel="noopener noreferrer"
        >
          Quiero pasarme al Plus
        </a>
        <Link href="/#planes" className="btn">
          Ver los planes
        </Link>
      </p>
      <form action={cerrarSesionCliente} style={{ marginTop: '1.5rem' }}>
        <button type="submit" className="btn btn--mini">
          Salir
        </button>
      </form>
    </main>
  )
}
