'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { EstadoAccion } from '@/components/EditorLinks'
import type { ContactInfo } from '@/lib/types'

function Guardar() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar datos de contacto'}
    </button>
  )
}

const REDES = [
  { id: 'instagram', nombre: 'Instagram', placeholder: 'usuario' },
  { id: 'linkedin', nombre: 'LinkedIn', placeholder: 'in/usuario' },
  { id: 'facebook', nombre: 'Facebook', placeholder: 'usuario' },
  { id: 'tiktok', nombre: 'TikTok', placeholder: 'usuario' },
  { id: 'youtube', nombre: 'YouTube', placeholder: '@canal' },
] as const

/**
 * Los datos que se guardan en la agenda del que recibe tu tarjeta.
 *
 * Están separados de los botones a propósito, y conviene que se entienda en la
 * interfaz: un botón es algo que el visitante toca; esto es lo que queda en su
 * teléfono cuando toca «Guardar contacto». Se suelen repetir, pero no siempre:
 * hay quien quiere su teléfono en la agenda sin tener un botón de llamada.
 */
export function EditorContacto({
  contacto,
  guardar,
  profileId,
}: {
  contacto: ContactInfo | null
  guardar: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>
  /**
   * Sólo lo manda el panel de administración, que edita perfiles ajenos. En el
   * panel del cliente el perfil sale de la sesión y este campo no existe: un
   * id en el formulario es un id que el navegador puede cambiar.
   */
  profileId?: string
}) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(guardar, {})

  return (
    <form action={accion} className="tarjeta">
      {profileId && <input type="hidden" name="profile_id" value={profileId} />}
      <h3>Datos para la agenda</h3>
      <p className="vacio" style={{ padding: 0, marginBottom: '1rem' }}>
        Es lo que se guarda en el teléfono del otro cuando toca «Guardar contacto». Lo que
        dejes vacío, simplemente no aparece.
      </p>

      {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
      {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

      <div className="fila">
        <label className="campo">
          <span>Teléfono</span>
          <input
            type="tel"
            name="telefono"
            defaultValue={contacto?.telefono ?? ''}
            placeholder="2664123456"
          />
          <small>Con característica, sin 0 ni 15.</small>
        </label>

        <label className="campo">
          <span>Email</span>
          <input
            type="email"
            name="email"
            defaultValue={contacto?.email ?? ''}
            placeholder="hola@ejemplo.com.ar"
          />
        </label>
      </div>

      <label className="campo">
        <span>Dirección</span>
        <input
          type="text"
          name="direccion"
          defaultValue={contacto?.direccion ?? ''}
          placeholder="Av. Illia 350, San Luis"
        />
      </label>

      <fieldset className="paletas">
        <legend>Redes</legend>
        <div className="fila fila--envuelve">
          {REDES.map((red) => (
            <label className="campo" key={red.id}>
              <span>{red.nombre}</span>
              <input
                type="text"
                name={`red_${red.id}`}
                defaultValue={contacto?.redes?.[red.id] ?? ''}
                placeholder={red.placeholder}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <Guardar />
    </form>
  )
}
