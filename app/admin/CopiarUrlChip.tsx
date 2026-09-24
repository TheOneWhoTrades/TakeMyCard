'use client'

import { useState } from 'react'
import { copiarAlPortapapeles } from '@/components/BotonCopiar'

/**
 * Copia la URL NDEF exacta desde el backoffice. Evita errores de tipeo al
 * programar una tarjeta física: el chip debe llevar /t/<codigo>, no el slug.
 */
export function CopiarUrlChip({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    if (!(await copiarAlPortapapeles(url))) return
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button type="button" className="btn btn--mini" onClick={copiar}>
      <span aria-live="polite">{copiado ? '¡URL copiada!' : 'Copiar URL para el chip'}</span>
    </button>
  )
}
