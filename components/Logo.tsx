import { MARCA } from '@/lib/marca'

/**
 * Logo: la palabra «Card» dentro de una tarjeta, con el símbolo de NFC al lado.
 *
 * La palabra «Card» es parte del dibujo y no del nombre --así está definido el
 * logo-- por eso está escrita acá. Todo lo demás (el nombre que acompaña al
 * símbolo, el texto alternativo) sale de MARCA, para que un cambio de nombre no
 * deje restos.
 *
 * Va como SVG en línea y no como archivo de imagen por tres razones: hereda el
 * color del texto (`currentColor`), así que funciona igual sobre papel claro
 * que sobre fondo oscuro sin tener dos versiones; no agrega un pedido de red
 * más en una página que se abre desde un celular en la calle; y se ve nítido
 * en cualquier pantalla.
 */
export function Logo({
  className,
  ancho = 132,
}: {
  className?: string
  ancho?: number
}) {
  return (
    <svg
      className={className}
      width={ancho}
      height={(ancho * 62) / 132}
      viewBox="0 0 132 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={MARCA.nombre}
    >
      {/* La tarjeta. Proporción 85.6 x 54 mm, la real de una tarjeta de crédito. */}
      <rect
        x="1.6"
        y="1.6"
        width="88"
        height="56"
        rx="4"
        stroke="currentColor"
        strokeWidth="3.2"
      />

      {/* Filete interior: el detalle que le da el aire de diario impreso. */}
      <rect
        x="7.4"
        y="7.4"
        width="76.4"
        height="44.4"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.42"
      />

      {/* La palabra «Card», en la serif del sitio. */}
      <text
        x="45.8"
        y="37.4"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--fuente-serif), Georgia, serif"
        fontSize="25"
        fontWeight="700"
        letterSpacing="-0.6"
      >
        Card
      </text>

      {/* Ondas de NFC, saliendo de la tarjeta hacia afuera. */}
      <g stroke="currentColor" strokeLinecap="round" fill="none">
        <path d="M99 21.5a15 15 0 0 1 0 19" strokeWidth="3.2" />
        <path d="M109 14.5a25.5 25.5 0 0 1 0 33" strokeWidth="3.2" opacity="0.7" />
        <path d="M119 7.5a36 36 0 0 1 0 47" strokeWidth="3.2" opacity="0.4" />
      </g>
    </svg>
  )
}

/**
 * Logo + nombre, para la cabecera del sitio comercial.
 */
export function Marca({ className }: { className?: string }) {
  return (
    <span className={className}>
      <Logo ancho={34} />
      <span className="marca__nombre">{MARCA.nombre}</span>
    </span>
  )
}
