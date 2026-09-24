'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { hrefDeLink, LINK_META } from '@/lib/links'
import { LINK_TIPOS, type Link, type LinkTipo } from '@/lib/types'

/**
 * Editor de los botones de contacto de un perfil.
 *
 * Las acciones llegan por props en vez de importarse: el mismo editor lo usan
 * el panel nuestro (que puede tocar cualquier perfil) y el del cliente (que
 * sólo toca el suyo), y cada uno pasa sus propias Server Actions. Duplicar el
 * componente para cambiar cuatro imports era garantía de que uno de los dos se
 * quedara atrás.
 */
export type EstadoAccion = { error?: string; ok?: string }

export type AccionesLinks = {
  crear: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>
  actualizar: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>
  eliminar: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>
  mover: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>
}

function Enviar({ texto, clase = 'btn' }: { texto: string; clase?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={clase} disabled={pending}>
      {pending ? '…' : texto}
    </button>
  )
}

function SelectorTipo({ nombre, valor }: { nombre: string; valor?: LinkTipo }) {
  return (
    <select name={nombre} defaultValue={valor ?? 'whatsapp'}>
      {LINK_TIPOS.map((t) => (
        <option key={t} value={t}>
          {LINK_META[t].icono} {LINK_META[t].nombre}
        </option>
      ))}
    </select>
  )
}

function FilaLink({
  link,
  profileId,
  esPrimero,
  esUltimo,
  acciones,
}: {
  link: Link
  profileId: string
  esPrimero: boolean
  esUltimo: boolean
  acciones: AccionesLinks
}) {
  const href = hrefDeLink(link)
  const [estadoActualizar, actualizar] = useActionState<EstadoAccion, FormData>(acciones.actualizar, {})
  const [estadoSubir, subir] = useActionState<EstadoAccion, FormData>(acciones.mover, {})
  const [estadoBajar, bajar] = useActionState<EstadoAccion, FormData>(acciones.mover, {})
  const [estadoEliminar, eliminar] = useActionState<EstadoAccion, FormData>(acciones.eliminar, {})

  return (
    <div className="tarjeta">
      <form action={actualizar}>
        <input type="hidden" name="id" value={link.id} />
        <input type="hidden" name="profile_id" value={profileId} />

        <div className="fila">
          <label className="campo" style={{ flex: '0 1 11rem' }}>
            <span>Tipo</span>
            <SelectorTipo nombre="tipo" valor={link.tipo} />
          </label>

          <label className="campo">
            <span>Texto del botón</span>
            <input type="text" name="label" defaultValue={link.label} required />
          </label>

          <label className="campo">
            <span>Valor</span>
            <input
              type="text"
              name="valor"
              defaultValue={link.valor}
              placeholder={LINK_META[link.tipo].placeholder}
              required
            />
            <small>
              {href ? (
                <>
                  Abre: <code>{href}</code>
                </>
              ) : link.tipo === 'alias_cbu' ? (
                'Se muestra con botón de copiar (no es un enlace).'
              ) : (
                'El valor guardado no es una URL válida. Corregilo antes de dejarlo visible.'
              )}
            </small>
          </label>
        </div>

        <div className="admin__acciones">
          <label className="campo--check" style={{ margin: 0 }}>
            <input type="checkbox" name="activo" defaultChecked={link.activo} />
            <span>Visible</span>
          </label>
          <Enviar texto="Guardar" clase="btn btn--mini" />
        </div>
        {estadoActualizar.error && <div className="mensaje mensaje--error">{estadoActualizar.error}</div>}
        {estadoActualizar.ok && <div className="mensaje mensaje--ok">{estadoActualizar.ok}</div>}
      </form>

      <div className="admin__acciones" style={{ marginTop: '0.5rem' }}>
        <form action={subir}>
          <input type="hidden" name="id" value={link.id} />
          <input type="hidden" name="profile_id" value={profileId} />
          <input type="hidden" name="direccion" value="arriba" />
          <button type="submit" className="btn btn--mini" disabled={esPrimero} aria-label="Subir">
            ↑
          </button>
        </form>
        <form action={bajar}>
          <input type="hidden" name="id" value={link.id} />
          <input type="hidden" name="profile_id" value={profileId} />
          <input type="hidden" name="direccion" value="abajo" />
          <button type="submit" className="btn btn--mini" disabled={esUltimo} aria-label="Bajar">
            ↓
          </button>
        </form>
        <form action={eliminar}>
          <input type="hidden" name="id" value={link.id} />
          <input type="hidden" name="profile_id" value={profileId} />
          <button type="submit" className="btn btn--mini btn--peligro">
            Eliminar
          </button>
        </form>
      </div>
      {estadoSubir.error && <div className="mensaje mensaje--error">{estadoSubir.error}</div>}
      {estadoBajar.error && <div className="mensaje mensaje--error">{estadoBajar.error}</div>}
      {estadoEliminar.error && <div className="mensaje mensaje--error">{estadoEliminar.error}</div>}
    </div>
  )
}

export function EditorLinks({
  profileId,
  links,
  acciones,
}: {
  profileId: string
  links: Link[]
  acciones: AccionesLinks
}) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(acciones.crear, {})

  return (
    <>
      <h2>Links ({links.length})</h2>

      {links.length === 0 ? (
        <p className="vacio">Este perfil todavía no tiene botones de contacto.</p>
      ) : (
        links.map((link, i) => (
          <FilaLink
            key={link.id}
            link={link}
            profileId={profileId}
            esPrimero={i === 0}
            esUltimo={i === links.length - 1}
            acciones={acciones}
          />
        ))
      )}

      <h2>Agregar link</h2>
      <form action={accion} className="tarjeta">
        <input type="hidden" name="profile_id" value={profileId} />

        {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
        {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

        <div className="fila">
          <label className="campo" style={{ flex: '0 1 11rem' }}>
            <span>Tipo</span>
            <SelectorTipo nombre="tipo" />
          </label>

          <label className="campo">
            <span>Texto del botón</span>
            <input type="text" name="label" placeholder="Escribime por WhatsApp" required />
          </label>

          <label className="campo">
            <span>Valor</span>
            <input type="text" name="valor" placeholder="2664123456" required />
            <small>Número, usuario o URL según el tipo.</small>
          </label>
        </div>

        <Enviar texto="Agregar link" clase="btn btn--primario" />
      </form>
    </>
  )
}
