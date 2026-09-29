import Link from 'next/link'
import { Marca } from '@/components/Logo'
import { MARCA } from '@/lib/marca'
import { FormularioIngreso } from './formulario'

export const metadata = {
  title: 'Ingresar',
  robots: { index: false },
}

export default async function PaginaIngresar({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; aviso?: string }>
}) {
  const { next, error, aviso } = await searchParams

  return (
    <main className="login">
      <Link href="/" className="masthead__link">
        <Marca className="marca" />
      </Link>

      <h1>Tu panel</h1>
      <p>
        Para clientes de los planes Plus y Premium. Si tenés el plan Básico, los cambios
        los hacemos nosotros: escribinos y listo.
      </p>

      {aviso === 'cuenta-confirmada' && (
        <div className="mensaje mensaje--ok">
          <strong>Tu cuenta quedó confirmada.</strong> Entrá con tu email o con la
          contraseña que elegiste.
        </div>
      )}

      {error === 'enlace-invalido' && (
        <div className="mensaje mensaje--error">
          Ese enlace ya se usó o venció. Pedí uno nuevo con tu email.
        </div>
      )}

      <FormularioIngreso next={next ?? '/panel'} />

      <p className="login__pie">
        ¿Todavía no tenés cuenta? <Link href="/crear-cuenta">Creala acá</Link>.
        <br />
        ¿Sos administrador de {MARCA.nombre}? <Link href="/login">Entrá por acá</Link>.
      </p>
    </main>
  )
}
