'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { EstadoAccion } from '@/components/EditorLinks'
import type { Card } from '@/lib/types'
import { eliminarTarjeta, registrarTarjeta } from './actions'

function Boton({ texto, clase = 'btn' }: { texto: string; clase?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={clase} disabled={pending}>
      {pending ? '…' : texto}
    </button>
  )
}

/**
 * Registro de las tarjetas físicas entregadas.
 *
 * Sirve para dos cosas concretas del negocio: saber si un cliente ya usó las
 * dos que incluye el plan --las siguientes se cobran-- y tener fecha de entrega
 * cuando alguien reclama que una tarjeta dejó de funcionar.
 *
 * Es información interna: no sale nunca a la página pública ni la ve el cliente
 * en su panel.
 */
export function EditorTarjetas({ profileId, cards }: { profileId: string; cards: Card[] }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(registrarTarjeta, {})

  const incluidas = cards.filter((c) => !c.reposicion).length
  const repuestos = cards.length - incluidas

  return (
    <>
      <p className="vacio" style={{ padding: 0, marginBottom: '0.75rem' }}>
        {incluidas} de las 2 incluidas en el plan
        {repuestos > 0 && ` · ${repuestos} de repuesto`}
      </p>

      {cards.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th>Entregada</th>
              <th>Tipo</th>
              <th>Nota</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id}>
                <td>{card.entregada_el ?? '—'}</td>
                <td>
                  <span className={`pastilla ${card.reposicion ? '' : 'pastilla--ok'}`}>
                    {card.reposicion ? 'repuesto' : 'incluida'}
                  </span>
                </td>
                <td>{card.nota ?? ''}</td>
                <td style={{ textAlign: 'right' }}>
                  <form action={eliminarTarjeta}>
                    <input type="hidden" name="id" value={card.id} />
                    <input type="hidden" name="profile_id" value={profileId} />
                    <Boton texto="Borrar" clase="btn btn--mini btn--peligro" />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={accion} className="tarjeta">
        <input type="hidden" name="profile_id" value={profileId} />

        {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
        {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

        <div className="fila">
          <label className="campo" style={{ flex: '0 1 12rem' }}>
            <span>Fecha de entrega</span>
            <input type="date" name="entregada_el" />
          </label>

          <label className="campo">
            <span>Nota</span>
            <input type="text" name="nota" placeholder="Entregada en el estudio" />
          </label>
        </div>

        <label className="campo--check">
          <input type="checkbox" name="reposicion" />
          <span>Es una reposición (se cobra aparte)</span>
        </label>

        <Boton texto="Registrar tarjeta" clase="btn btn--primario" />
      </form>
    </>
  )
}
