import Link from 'next/link'
import type { Metrica } from '@/lib/types'

export const PERIODOS = [
  { dias: 7, nombre: '7 días' },
  { dias: 30, nombre: '30 días' },
  { dias: 90, nombre: '3 meses' },
  { dias: 365, nombre: '1 año' },
] as const

/**
 * Panel de estadísticas: total del período y ranking de botones.
 *
 * Es exactamente lo que pide el brief y nada más. En particular no hay
 * «visitantes únicos» ni mapa de procedencia, y no es una omisión: no guardamos
 * ningún dato que permita distinguir a un visitante de otro, así que un número
 * de únicos sería inventado. Lo que sí se puede afirmar con honestidad es
 * cuántas veces se abrió la página y cuántas se tocó cada botón.
 *
 * El ranking incluye los botones con cero clics a propósito: saber cuál no
 * toca nadie es la mitad del valor de la herramienta.
 */
export function Metricas({
  metricas,
  dias,
  base,
}: {
  metricas: Metrica[]
  dias: number
  /** Ruta sobre la que se arman los links de período. */
  base: string
}) {
  const total = metricas.find((m) => m.categoria === 'perfil')
  const botones = metricas.filter((m) => m.categoria !== 'perfil')
  const maximo = Math.max(1, ...botones.map((b) => b.clics))

  const vistas = total?.vistas ?? 0
  const clics = total?.clics ?? 0
  // Cuántas de las aperturas terminaron en alguien tocando algo. Es la única
  // métrica derivada que tiene sentido acá: dice si la página convierte.
  const conversion = vistas > 0 ? Math.round((clics / vistas) * 100) : 0

  return (
    <>
      <nav className="periodos">
        {PERIODOS.map((p) => (
          <Link
            key={p.dias}
            href={`${base}?dias=${p.dias}`}
            className={`btn btn--mini${p.dias === dias ? ' btn--primario' : ''}`}
          >
            {p.nombre}
          </Link>
        ))}
      </nav>

      <div className="numeros">
        <div className="numero">
          <span className="numero__valor">{vistas.toLocaleString('es-AR')}</span>
          <span className="numero__etiqueta">veces que se abrió la página</span>
        </div>
        <div className="numero">
          <span className="numero__valor">{clics.toLocaleString('es-AR')}</span>
          <span className="numero__etiqueta">botones tocados</span>
        </div>
        <div className="numero">
          <span className="numero__valor">{conversion}%</span>
          <span className="numero__etiqueta">de las visitas tocó algo</span>
        </div>
      </div>

      <h3>Ranking de botones</h3>
      {botones.length === 0 ? (
        <p className="vacio">Todavía no hay botones cargados.</p>
      ) : (
        <ul className="ranking">
          {botones.map((boton) => (
            <li key={boton.link_id ?? boton.categoria} className="ranking__fila">
              <span className="ranking__etiqueta">{boton.etiqueta}</span>
              <span className="ranking__barra" aria-hidden="true">
                <span
                  className="ranking__relleno"
                  style={{ width: `${(boton.clics / maximo) * 100}%` }}
                />
              </span>
              <span className="ranking__valor">{boton.clics.toLocaleString('es-AR')}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="vacio" style={{ padding: 0, marginTop: '1.5rem' }}>
        Los números no identifican a nadie: no usamos cookies ni guardamos la IP de quien
        abre tu tarjeta. Por eso no hay «visitantes únicos»: sería un número inventado.
      </p>
    </>
  )
}

/** Normaliza el parámetro `dias` de la URL a uno de los períodos ofrecidos. */
export function periodoValido(valor: string | undefined): number {
  const dias = Number(valor)
  return PERIODOS.some((p) => p.dias === dias) ? dias : 30
}
