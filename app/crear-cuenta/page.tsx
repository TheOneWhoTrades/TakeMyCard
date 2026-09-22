import Link from 'next/link'
import { Marca } from '@/components/Logo'
import { linkWhatsapp, MENSAJES } from '@/lib/marca'
import { FormularioAlta } from './formulario'

export const metadata = {
  title: 'Crear cuenta',
  description: 'Creá tu cuenta para administrar tu tarjeta digital.',
  robots: { index: false },
}

export default function PaginaCrearCuenta() {
  return (
    <main className="login">
      <Link href="/" className="masthead__link">
        <Marca className="marca" />
      </Link>

      <h1>Crear cuenta</h1>
      <p>
        Para clientes de los planes Plus y Premium, que editan su página ellos mismos.
      </p>

      {/* Que esto quede claro antes de llenar el formulario evita el reclamo de
          "me registré y no puedo entrar", que sería el primer mail de soporte. */}
      <div className="mensaje legal__etapa">
        <strong>Cómo sigue.</strong> Crear la cuenta es el primer paso, pero no te da
        acceso sola: después nosotros la vinculamos con tu tarjeta y ahí se te habilita el
        panel. Si todavía no sos cliente,{' '}
        <a href={linkWhatsapp(MENSAJES.general)} target="_blank" rel="noopener noreferrer">
          escribinos primero
        </a>
        .
      </div>

      <FormularioAlta />

      <p className="login__pie">
        ¿Ya tenés cuenta? <Link href="/ingresar">Ingresá por acá</Link>.
      </p>
    </main>
  )
}
