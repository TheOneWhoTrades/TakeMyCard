'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { iniciarSesion } from './actions'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? 'Ingresando…' : 'Ingresar'}
    </button>
  )
}

export function FormularioLogin({ next }: { next: string }) {
  const [estado, accion] = useActionState(iniciarSesion, {} as { error?: string })

  return (
    <form action={accion}>
      <input type="hidden" name="next" value={next} />

      {estado?.error && <div className="mensaje mensaje--error">{estado.error}</div>}

      <label className="campo">
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required autoFocus />
      </label>

      <label className="campo">
        <span>Contraseña</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>

      <Boton />
    </form>
  )
}
