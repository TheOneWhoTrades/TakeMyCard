import Link from 'next/link'
import { MARCA } from '@/lib/marca'
import { FormularioLogin } from './formulario'

export const metadata = { title: 'Administración', robots: { index: false } }

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <main className="login">
      <h1>{MARCA.nombre}</h1>
      <p>Acceso de administradores.</p>

      {error === 'no-admin' && (
        <div className="mensaje mensaje--error">
          Tu cuenta no tiene permisos de administrador. Pedile a otro admin que te dé
          de alta en la tabla <code>admin_users</code>.
        </div>
      )}

      <FormularioLogin next={next ?? '/admin'} />

      <p className="login__pie">
        ¿Sos cliente y venís a editar tu página? <Link href="/ingresar">Entrá por acá</Link>.
      </p>
    </main>
  )
}
