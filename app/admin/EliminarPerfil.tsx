'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { EstadoAccion } from '@/components/EditorLinks'
import { eliminarPerfil } from './actions'

function BotonEliminar() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--peligro" disabled={pending}>
      {pending ? 'Eliminando…' : 'Eliminar perfil'}
    </button>
  )
}

export function EliminarPerfil({ profileId }: { profileId: string }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(eliminarPerfil, {})

  return (
    <form
      action={accion}
      onSubmit={(event) => {
        if (
          !window.confirm(
            'Esta acción elimina el perfil y toda su información asociada de forma permanente. ¿Eliminar de todos modos?',
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={profileId} />
      {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
      <BotonEliminar />
    </form>
  )
}
