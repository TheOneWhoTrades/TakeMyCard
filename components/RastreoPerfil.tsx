'use client'

import { useEffect } from 'react'

/**
 * Cuenta la vista del perfil y los clics en los botones.
 *
 * Dos decisiones que importan:
 *
 * 1. No envuelve a los botones. Los enlaces del perfil se renderizan en el
 *    servidor como `<a>` comunes y siguen funcionando sin JavaScript; esto
 *    engancha un único listener en la lista y lee `data-link-id`. Si el
 *    navegador tiene JS apagado o el script no llega a cargar, la tarjeta
 *    funciona igual y lo único que se pierde es la estadística.
 *
 * 2. Usa `sendBeacon`. Un `fetch` dentro de un handler de clic compite con la
 *    navegación que ese mismo clic dispara y el navegador lo cancela: el clic
 *    que más importa --el que se va a WhatsApp-- sería justo el que no se
 *    cuenta. `sendBeacon` encola el envío fuera del ciclo de vida de la página.
 *
 * No manda ningún dato del visitante: sólo el slug, el tipo de evento, el id
 * del botón y el dominio desde el que llegó. Ver app/api/evento/route.ts.
 */
export function RastreoPerfil({ slug }: { slug: string }) {
  useEffect(() => {
    const enviar = (tipo: 'vista' | 'clic', linkId?: string) => {
      const cuerpo = JSON.stringify({
        slug,
        tipo,
        linkId: linkId ?? null,
        // Sólo en la vista: en el clic el referrer ya es esta misma página.
        referrer: tipo === 'vista' ? document.referrer || null : null,
      })

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/evento', new Blob([cuerpo], { type: 'application/json' }))
          return
        }
        // Safari viejo sin sendBeacon. `keepalive` hace lo mismo peor.
        void fetch('/api/evento', {
          method: 'POST',
          body: cuerpo,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
      } catch {
        // Bloqueador de contenido, modo restringido, lo que sea: la página ya
        // está servida y andando. La analítica no puede romper nada.
      }
    }

    enviar('vista')

    // Delegación: un solo listener para todos los botones, también para los que
    // se agreguen después. `capture` para que corra aunque el handler del
    // propio elemento detenga la propagación.
    const alHacerClic = (evento: MouseEvent) => {
      const destino = (evento.target as HTMLElement | null)?.closest?.('[data-link-id]')
      const id = destino?.getAttribute('data-link-id')
      if (id) enviar('clic', id)
    }

    document.addEventListener('click', alHacerClic, { capture: true })
    return () => document.removeEventListener('click', alHacerClic, { capture: true })
  }, [slug])

  return null
}
