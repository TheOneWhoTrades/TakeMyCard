'use client'

import { useState } from 'react'
import { IconoLink } from '@/components/IconoLink'
import type { LinkTipo } from '@/lib/types'

/** Copia texto con una alternativa para navegadores que niegan Clipboard API. */
export async function copiarAlPortapapeles(valor: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(valor)
    return true
  } catch {
    // Safari sin permiso de portapapeles: se cae al método viejo.
    const area = document.createElement('textarea')
    area.value = valor
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(area)
    }
  }
}

/**
 * Alias/CBU no es un enlace navegable: lo que el visitante necesita es pegarlo
 * en su app del banco. Por eso se renderiza como botón de copiar y no como <a>.
 */
export function BotonCopiar({
  id,
  tipo,
  label,
  valor,
}: {
  id: string
  tipo: LinkTipo
  label: string
  valor: string
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    if (!(await copiarAlPortapapeles(valor))) return
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button type="button" className="boton" data-link-id={id} onClick={copiar}>
      <IconoLink tipo={tipo} />
      <span className="boton__texto">
        <span className="boton__label">{label}</span>
        <span className="boton__valor">{valor}</span>
      </span>
      <span className="boton__estado" aria-live="polite">
        {copiado ? '¡Copiado!' : 'Copiar'}
      </span>
    </button>
  )
}
