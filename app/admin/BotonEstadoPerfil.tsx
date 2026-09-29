'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { EstadoAccion } from '@/components/EditorLinks'
import { alternarActivo } from './actions'

function Boton({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--mini" disabled={pending}>
      {pending ? '…' : activo ? 'Pausar' : 'Activar'}
    </button>
  )
}

export function BotonEstadoPerfil({ id, activo }: { id: string; activo: boolean }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(alternarActivo, {})

  return (
    <div style={{ display: 'inline-block' }}>
      <form
        action={accion}
        onSubmit={(event) => {
          if (
            activo &&
            !window.confirm(
              'Al pausar el perfil, la tarjeta dejará de mostrar su contenido público. Podés activarlo nuevamente después. ¿Continuar?',
            )
          ) {
            event.preventDefault()
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="activo" value={String(activo)} />
        <Boton activo={activo} />
      </form>
      {estado.error && (
        <div className="mensaje mensaje--error" role="status" style={{ marginTop: '0.5rem' }}>
          {estado.error}
        </div>
      )}
      {estado.ok && (
        <div className="mensaje mensaje--ok" role="status" style={{ marginTop: '0.5rem' }}>
          {estado.ok}
        </div>
      )}
    </div>
  )
}
