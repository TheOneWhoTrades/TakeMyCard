/**
 * Las seis paletas entre las que elige el cliente.
 *
 * El brief pide «5-6 colores predeterminados», todos dentro de la familia de la
 * marca: verdes, tierras y marrones. No hay selector libre de color a propósito
 * --un cliente eligiendo un fucsia a mano arruina la estética de diario que
 * sostiene todo el producto-- y además así cualquier tarjeta se reconoce como
 * nuestra.
 *
 * Cada paleta define los tres colores que cambian en la página del profesional:
 * el fondo, el acento (botón principal, filetes fuertes) y el texto que va
 * encima del acento. El resto de la tipografía y la estructura no se toca: es
 * lo que hace que todas se vean de la misma familia.
 *
 * Los valores se inyectan como variables CSS en el `<main>` del perfil, así que
 * el modo oscuro y el resto del sitio siguen funcionando igual.
 */

export type Paleta = {
  id: string
  nombre: string
  /** Fondo de la página del profesional. */
  papel: string
  /** Superficie de los botones y las tarjetas. */
  superficie: string
  /** Color del texto. */
  tinta: string
  /** Filetes y bordes. */
  regla: string
  /** Acento: botón principal, subrayados, sello. */
  acento: string
  /** Texto sobre el acento. Tiene que contrastar con él, no con el papel. */
  acentoTexto: string
}

export const PALETAS: Paleta[] = [
  {
    id: 'bosque',
    nombre: 'Bosque',
    papel: '#f2ede3',
    superficie: '#fbf8f2',
    tinta: '#191714',
    regla: '#cec5b2',
    acento: '#2c5941',
    acentoTexto: '#fbf8f2',
  },
  {
    id: 'oliva',
    nombre: 'Oliva',
    papel: '#f0efe2',
    superficie: '#faf9f0',
    tinta: '#1d1e15',
    regla: '#c9c8ac',
    acento: '#5a6b2f',
    acentoTexto: '#faf9f0',
  },
  {
    id: 'tierra',
    nombre: 'Tierra',
    papel: '#f5ece2',
    superficie: '#fdf7f0',
    tinta: '#201811',
    regla: '#d8c4ad',
    acento: '#9c5a22',
    acentoTexto: '#fdf7f0',
  },
  {
    id: 'roble',
    nombre: 'Roble',
    papel: '#f3ece1',
    superficie: '#fbf6ee',
    tinta: '#1c1611',
    regla: '#d2c3ac',
    acento: '#6b4526',
    acentoTexto: '#fbf6ee',
  },
  {
    id: 'salvia',
    nombre: 'Salvia',
    papel: '#eef0ea',
    superficie: '#f9faf6',
    tinta: '#181c17',
    regla: '#c4ccbd',
    acento: '#41684f',
    acentoTexto: '#f9faf6',
  },
  {
    id: 'tabaco',
    nombre: 'Tabaco',
    papel: '#f4eee4',
    superficie: '#fcf8f1',
    tinta: '#1f1a13',
    regla: '#d4c6ae',
    acento: '#7d5b2e',
    acentoTexto: '#fcf8f1',
  },
]

export const PALETA_POR_DEFECTO = PALETAS[0]

export function obtenerPaleta(id: string | null | undefined): Paleta {
  return PALETAS.find((p) => p.id === id) ?? PALETA_POR_DEFECTO
}

/**
 * Traduce la paleta a variables CSS en línea.
 *
 * Van como `style` del contenedor y no como clase porque las paletas son datos
 * de la base: generar seis clases y mantenerlas sincronizadas con la tabla es
 * una fuente de desincronización sin ninguna ventaja.
 */
export function variablesDePaleta(paleta: Paleta): React.CSSProperties {
  return {
    '--fondo': paleta.papel,
    '--superficie': paleta.superficie,
    '--texto': paleta.tinta,
    '--borde': paleta.regla,
    '--acento': paleta.acento,
    '--acento-texto': paleta.acentoTexto,
    '--papel': paleta.papel,
    '--papel-alto': paleta.superficie,
    '--tinta': paleta.tinta,
    '--regla': paleta.regla,
  } as React.CSSProperties
}
