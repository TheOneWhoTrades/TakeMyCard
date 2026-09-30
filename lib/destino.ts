/**
 * A dónde se puede mandar a alguien después de ingresar.
 *
 * Sólo a rutas de este mismo sitio. Sin esta comprobación, un link del tipo
 * /ingresar?next=https://sitio-falso.com convierte nuestro login en un
 * trampolín de phishing: la persona ve nuestro dominio, ingresa, y termina en
 * otro lado creyendo que sigue en el nuestro.
 *
 * No alcanza con mirar que empiece con "/". `//otro.com` y `/\otro.com`
 * empiezan con barra y el navegador los toma como absolutos; y el navegador
 * además borra tabulaciones y saltos de línea de una URL, así que
 * `/<tab>/otro.com` pasa cualquier chequeo de texto y termina siendo
 * `//otro.com`. En vez de perseguir cada variante, el destino se interpreta con
 * el mismo parser de URLs que usa el navegador y se acepta sólo si queda en
 * nuestro origen.
 */

/** Origen ficticio para resolver rutas relativas: nunca se usa como destino. */
const ORIGEN = 'https://destino.invalid'

export function destinoSeguro(valor: string | null | undefined, porDefecto: string): string {
  if (!valor || !valor.startsWith('/')) return porDefecto

  let url: URL
  try {
    url = new URL(valor, ORIGEN)
  } catch {
    return porDefecto
  }

  if (url.origin !== ORIGEN) return porDefecto

  // Se devuelve lo que interpretó el parser, no el texto original: es lo que
  // el navegador va a seguir, así que es lo único que tiene sentido validar.
  return url.pathname + url.search + url.hash
}
