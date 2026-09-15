import Link from 'next/link'
import { requerirAdmin } from '@/lib/auth'
import { cerrarSesion } from '@/app/login/actions'

export const metadata = { title: 'Panel · TakeMyCard', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requerirAdmin()

  return (
    <div className="admin">
      <header className="admin__barra">
        <h1>
          <Link href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>
            TakeMyCard · Panel
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
