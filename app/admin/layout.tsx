import Link from 'next/link'
import { requerirAdmin } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'
import { MARCA } from '@/lib/marca'

export const metadata = { title: 'Administración', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requerirAdmin()

  return (
    <div className="admin">
      <header className="admin__barra">
        <h1>
          <Link href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>
            {MARCA.nombre} · Administración
          </Link>
        </h1>
        <div className="admin__acciones">
          <span className="pastilla">{user.email}</span>
          <form action={cerrarSesion}>
            <button type="submit" className="btn btn--mini">
              Salir
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
