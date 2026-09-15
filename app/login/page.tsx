import { FormularioLogin } from './formulario'

export const metadata = { title: 'Ingresar · TakeMyCard', robots: { index: false } }

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <main className="login">
      <h1>Panel TakeMyCard</h1>
      <p>Acceso de administradores.</p>

      {error === 'no-admin' && (
        <div className="mensaje mensaje--error">
          Tu cuenta no tiene permisos de administrador. Pedile a otro admin que te dé
          de alta en la tabla <code>admin_users</code>.
        </div>
      )}

      <FormularioLogin next={next ?? '/admin'} />
    </main>
  )
}
