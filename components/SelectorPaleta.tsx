'use client'

import { useState } from 'react'
import { PALETAS } from '@/lib/paletas'

/**
 * Elección del color de la tarjeta digital.
 *
 * Son botones de radio de verdad --no divs con onClick-- para que funcionen con
 * teclado y con lector de pantalla sin trabajo extra: las flechas se mueven
 * entre opciones solas. Lo que se ve es la muestra de color; el radio está
 * oculto visualmente pero sigue ahí.
 */
export function SelectorPaleta({
  valor,
  onCambio,
}: {
  valor: string
  /** Para que el formulario pueda reflejar el color en la vista previa. */
  onCambio?: (id: string) => void
}) {
  const [elegida, setElegida] = useState(valor)

  const elegir = (id: string) => {
    setElegida(id)
    onCambio?.(id)
  }

  return (
    <fieldset className="paletas">
      <legend>Color de la tarjeta</legend>

      <div className="paletas__grilla">
        {PALETAS.map((paleta) => (
          <label
            key={paleta.id}
            className={`paleta${elegida === paleta.id ? ' paleta--activa' : ''}`}
            style={{ background: paleta.papel, borderColor: paleta.regla }}
          >
            <input
              type="radio"
              name="paleta"
              value={paleta.id}
              checked={elegida === paleta.id}
              onChange={() => elegir(paleta.id)}
              className="visualmente-oculto"
            />
            <span className="paleta__muestra" style={{ background: paleta.acento }} />
            <span className="paleta__nombre" style={{ color: paleta.tinta }}>
              {paleta.nombre}
            </span>
          </label>
        ))}
      </div>

      <small>
        Las seis están dentro de la familia de la marca. El texto y la estructura no
        cambian: lo que cambia es el color del fondo y de los botones.
      </small>
    </fieldset>
  )
}
