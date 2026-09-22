'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { EstadoAccion } from '@/components/EditorLinks'
import { vincularCuenta } from './actions'

function Boton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--mini btn--primario" disabled={pending}>
      {pending ? '…' : 'Vincular'}
    </button>
  )
}

export type CuentaPendiente = { user_id: string; email: string; creada_el: string }
export type PerfilParaVincular = { id: string; nombre: string; slug: string; plan: string }

/**
 * Cuentas que se crearon desde /crear-cuenta y todavía no tienen perfil.
 *
 * Es el paso de "dar de alta" que cierra el circuito: el cliente se crea la
 * cuenta solo, y acá la enganchamos con su perfil. Hasta que eso pasa la cuenta
 * no puede leer ni escribir nada --lo impide RLS, no la interfaz-- así que no
 * hay apuro ni riesgo en dejarla esperando.
 *
 * Se elige el perfil de una lista en vez de tipear el email: el email ya lo
 * sabemos (es esta fila), y lo que se puede escribir mal es el destino.
 */
export function CuentasPendientes({
  cuentas,
  perfiles,
}: {
  cuentas: CuentaPendiente[]
  perfiles: PerfilParaVincular[]
}) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(vincularCuenta, {})

  if (cuentas.length === 0) {
    return (
      <p className="vacio">
        No hay cuentas esperando. Cuando un cliente se cree la cuenta desde
        «Crear cuenta», aparece acá para que la vincules con su perfil.
      </p>
    )
  }

  return (
    <>
      {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
      {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

      <p className="vacio" style={{ padding: 0, marginBottom: '0.75rem' }}>
        {cuentas.length} cuenta{cuentas.length === 1 ? '' : 's'} sin perfil vinculado.
        Mientras no las vincules, quien entra sólo ve un aviso: no pueden hacer nada.
      </p>

      <table className="tabla">
        <thead>
          <tr>
            <th>Email</th>
            <th>Creada</th>
            <th>Vincular con</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map((cuenta) => (
            <tr key={cuenta.user_id}>
              <td style={{ overflowWrap: 'anywhere' }}>{cuenta.email}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {new Date(cuenta.creada_el).toLocaleDateString('es-AR')}
              </td>
              <td>
                <form action={accion} className="fila" style={{ gap: '0.4rem' }}>
                  {/* El email viaja oculto: la acción lo resuelve contra
                      auth.users del lado de la base, no acá. */}
                  <input type="hidden" name="email" value={cuenta.email} />
                  <select name="id" defaultValue="" required style={{ flex: '1 1 12rem' }}>
                    <option value="" disabled>
                      Elegí un perfil…
                    </option>
                    {perfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (/{p.slug}) · {p.plan}
                      </option>
                    ))}
                  </select>
                  <Boton />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="vacio" style={{ padding: 0, marginTop: '0.5rem' }}>
        Ojo: el panel de autoedición es de los planes Plus y Premium. Si vinculás una
        cuenta a un perfil Básico, la persona va a entrar y ver el aviso de que su plan no
        lo incluye.
      </p>
    </>
  )
}
