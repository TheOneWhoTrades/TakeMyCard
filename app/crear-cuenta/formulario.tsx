'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { crearCuenta, type EstadoAlta } from './actions'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? 'Creando…' : 'Crear mi cuenta'}
    </button>
  )
}

export function FormularioAlta() {
  const [estado, accion] = useActionState<EstadoAlta, FormData>(crearCuenta, {})

  if (estado.confirmar) {
    return (
      <div className="mensaje mensaje--ok">
        <strong>Cuenta creada.</strong> Te mandamos un email para confirmarla: abrilo y
        seguí el enlace. Después avisanos y vinculamos tu cuenta con tu tarjeta para que
        puedas entrar al panel.
      </div>
    )
  }

  return (
    <form action={accion}>
      {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}

      <label className="campo">
        <span>Tu email</span>
        <input type="email" name="email" autoComplete="email" required autoFocus />
        <small>Usá el mismo que nos diste al contratar: así la vinculamos más rápido.</small>
      </label>

      <label className="campo">
        <span>Contraseña</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <small>Mínimo 8 caracteres.</small>
      </label>

      <label className="campo">
        <span>Repetir contraseña</span>
        <input type="password" name="password2" autoComplete="new-password" required />
      </label>

      <Boton />

      <p className="login__pie">
        Al crear la cuenta aceptás los <Link href="/terminos">términos y condiciones</Link> y
        la <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </form>
  )
}
