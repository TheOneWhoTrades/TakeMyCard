import Link from 'next/link'
import { redirect } from 'next/navigation'
import { destinoSeguro } from '@/lib/destino'
import { MARCA } from '@/lib/marca'
import { supabaseServer } from '@/lib/supabase/server'
import { FormularioLogin } from './formulario'

export const metadata = { title: 'Administración', robots: { index: false } }

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  // Un admin con la sesión abierta va directo al backoffice. Sólo un admin: si
  // redirigiera cualquier sesión, un cliente que llega acá iría a /admin, que lo
  // devuelve acá por no ser admin, y así para siempre.
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (admin) redirect(destinoSeguro(next, '/admin'))
  }

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
