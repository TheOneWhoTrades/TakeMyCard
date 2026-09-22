import Link from 'next/link'
import { cerrarSesionCliente } from '@/app/ingresar/actions'
import { Marca } from '@/components/Logo'
import { requerirCliente } from '@/lib/auth'
import { CAPACIDADES } from '@/lib/types'

export const metadata = { title: 'Mi panel', robots: { index: false } }

// El panel muestra datos de la sesión: nunca se cachea.
export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requerirCliente()

  return (
    <div className="admin">
      <header className="admin__barra">
        <h1>
          <Link href="/panel" className="admin__marca">
            <Marca className="marca marca--chica" />
          </Link>
        </h1>
        <div className="admin__acciones">
          <a
            href={`/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--mini"
          >
            Ver mi página ↗
          </a>
          <form action={cerrarSesionCliente}>
            <button type="submit" className="btn btn--mini">
              Salir
            </button>
          </form>
        </div>
      </header>

      <nav className="admin__menu">
        <Link href="/panel">Mi página</Link>
        {CAPACIDADES[profile.plan].analytics && <Link href="/panel/estadisticas">Estadísticas</Link>}
      </nav>

      {!profile.activo && (
        <div className="mensaje mensaje--error">
          <strong>Tu página está pausada.</strong> Quien acerque tu tarjeta ve un aviso en
          lugar de tus datos. Escribinos para reactivarla; tus datos están intactos.
        </div>
      )}

      {children}
    </div>
  )
}
