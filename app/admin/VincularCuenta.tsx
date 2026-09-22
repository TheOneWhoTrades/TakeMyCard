'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { EstadoAccion } from '@/components/EditorLinks'
import { vincularCuenta } from './actions'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--mini" disabled={pending}>
      {pending ? '…' : 'Vincular'}
    </button>
  )
}

/**
 * Asocia la cuenta del cliente con su perfil para que pueda entrar al panel.
 *
 * La cuenta tiene que existir antes: se crea invitándolo desde Supabase
 * (Authentication → Users → Invite). No la creamos desde acá porque hacerlo
 * exige la clave de servicio, que se saltea todas las políticas de seguridad;
 * tenerla en el servidor web para una operación que hacemos tres veces por mes
 * es un riesgo que no paga.
 */
export function VincularCuenta({
  profileId,
  vinculada,
}: {
  profileId: string
  vinculada: boolean
}) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(vincularCuenta, {})

  return (
    <div className="tarjeta">
      <h3>Cuenta del cliente</h3>
      <p className="vacio" style={{ padding: 0, marginBottom: '0.75rem' }}>
        {vinculada
          ? 'Este perfil ya tiene una cuenta asociada. Si el plan es Plus o Premium, el cliente puede entrar a /panel y editarlo.'
          : 'Sin cuenta asociada. Invitá al cliente desde Supabase → Authentication → Users y después pegá acá su email.'}
      </p>

      {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
      {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

      <form action={accion}>
        <input type="hidden" name="id" value={profileId} />
        <div className="fila">
          <label className="campo">
            <span>Email de la cuenta</span>
            <input type="email" name="email" placeholder="cliente@ejemplo.com.ar" />
            <small>Dejalo vacío y guardá para desvincular la cuenta.</small>
          </label>
        </div>
        <Boton />
      </form>
    </div>
  )
}
