'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

/**
 * Carga y recorte de la foto de perfil y de la portada.
 *
 * Por qué se recorta acá y no en el servidor: la foto sale de la cámara de un
 * teléfono y pesa entre 3 y 8 MB. Subirla entera para recortarla después gasta
 * los datos del cliente, tarda en una conexión móvil y nos deja guardando un
 * original que nadie va a mirar. Recortando antes de subir, lo que viaja son
 * unos 80 KB.
 *
 * El recorte es sobre `<canvas>` y no con CSS: la vista previa y el archivo
 * final se dibujan con la misma función, así que lo que el cliente encuadra es
 * exactamente lo que queda guardado. Un recorte "visual" con overflow hidden se
 * ve bien en el panel y sale corrido en el archivo.
 *
 * La foto se sube a fotos/<profile_id>/..., y las políticas de la base atan esa
 * carpeta al perfil: nadie puede escribir en la de otro.
 */

type Props = {
  /** Carpeta de destino dentro del bucket. */
  profileId: string
  /** Nombre del input oculto que viaja con el formulario. */
  name: string
  tipo: 'perfil' | 'portada'
  valorInicial: string | null
  etiqueta: string
  ayuda?: string
  /** Avisa al contexto que muestra una vista previa después de confirmar el recorte. */
  onCambio?: (url: string | null) => void
}

const FORMATO = {
  perfil:  { relacion: 1,   anchoVista: 260, anchoFinal: 640,  nombre: 'perfil' },
  portada: { relacion: 3,   anchoVista: 360, anchoFinal: 1500, nombre: 'portada' },
} as const

/** 12 MB: por encima casi seguro es un archivo de cámara sin procesar. */
const MAX_BYTES = 12 * 1024 * 1024

export function SubirFoto({ profileId, name, tipo, valorInicial, etiqueta, ayuda, onCambio }: Props) {
  const formato = FORMATO[tipo]
  const altoVista = Math.round(formato.anchoVista / formato.relacion)

  const [url, setUrl] = useState<string | null>(valorInicial)
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const arrastre = useRef<{ x: number; y: number } | null>(null)

  /**
   * Dibuja la imagen cubriendo el lienzo, con el zoom y el desplazamiento
   * actuales. Es la única fuente de verdad del encuadre: la usan tanto la vista
   * previa como la exportación, con distinto tamaño de lienzo.
   */
  const dibujar = useCallback(
    (canvas: HTMLCanvasElement, escalaLienzo: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !imagen) return

      const ancho = canvas.width
      const alto = canvas.height

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, ancho, alto)

      // "Cover": la imagen siempre tapa el lienzo, nunca deja franjas vacías.
      const base = Math.max(ancho / imagen.width, alto / imagen.height)
      const escala = base * zoom
      const anchoFinal = imagen.width * escala
      const altoFinal = imagen.height * escala

      // El desplazamiento se guarda en unidades de la vista previa; al exportar
      // se multiplica por la relación entre los dos lienzos.
      const x = (ancho - anchoFinal) / 2 + offset.x * escalaLienzo
      const y = (alto - altoFinal) / 2 + offset.y * escalaLienzo

      ctx.drawImage(imagen, x, y, anchoFinal, altoFinal)
    },
    [imagen, zoom, offset],
  )

  useEffect(() => {
    if (canvasRef.current && imagen) dibujar(canvasRef.current, 1)
  }, [dibujar, imagen])

  /** Impide arrastrar la imagen más allá de sus bordes. */
  const limitar = useCallback(
    (x: number, y: number, conZoom = zoom) => {
      if (!imagen) return { x: 0, y: 0 }
      const base = Math.max(formato.anchoVista / imagen.width, altoVista / imagen.height)
      const escala = base * conZoom
      const margenX = Math.max(0, (imagen.width * escala - formato.anchoVista) / 2)
      const margenY = Math.max(0, (imagen.height * escala - altoVista) / 2)
      return {
        x: Math.min(margenX, Math.max(-margenX, x)),
        y: Math.min(margenY, Math.max(-margenY, y)),
      }
    },
    [imagen, zoom, formato.anchoVista, altoVista],
  )

  /**
   * Al alejar, el encuadre puede quedar fuera de los límites nuevos, así que el
   * zoom y el desplazamiento se ajustan juntos. Van en el mismo handler y no en
   * un efecto: dos `setState` encadenados por un efecto provocan un render de
   * más por cada paso del control deslizante.
   */
  function cambiarZoom(nuevo: number) {
    setZoom(nuevo)
    setOffset((actual) => limitar(actual.x, actual.y, nuevo))
  }

  function elegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    setError(null)

    if (!archivo.type.startsWith('image/')) {
      setError('Ese archivo no es una imagen.')
      return
    }
    if (archivo.size > MAX_BYTES) {
      setError('La imagen pesa más de 12 MB. Sacale una más chica o bajale la calidad.')
      return
    }

    const objeto = URL.createObjectURL(archivo)
    const img = new window.Image()
    img.onload = () => {
      setImagen(img)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      // El objeto sigue vivo mientras el <img> lo use; se libera al confirmar
      // o al cancelar.
    }
    img.onerror = () => {
      URL.revokeObjectURL(objeto)
      setError('No pudimos abrir esa imagen. Probá con otra.')
    }
    img.src = objeto

    // Permite volver a elegir el mismo archivo después de cancelar.
    evento.target.value = ''
  }

  function descartar() {
    if (imagen?.src.startsWith('blob:')) URL.revokeObjectURL(imagen.src)
    setImagen(null)
  }

  async function confirmar() {
    if (!imagen) return
    setSubiendo(true)
    setError(null)

    try {
      const lienzo = document.createElement('canvas')
      lienzo.width = formato.anchoFinal
      lienzo.height = Math.round(formato.anchoFinal / formato.relacion)
      dibujar(lienzo, lienzo.width / formato.anchoVista)

      const blob = await new Promise<Blob | null>((resolver) =>
        // JPEG y no PNG: una foto en PNG pesa cinco veces más sin verse mejor.
        lienzo.toBlob(resolver, 'image/jpeg', 0.85),
      )
      if (!blob) throw new Error('No se pudo generar la imagen.')

      const supabase = supabaseBrowser()
      // El nombre lleva la marca de tiempo para que el cambio se vea enseguida:
      // con un nombre fijo, el navegador y el CDN siguen mostrando la anterior.
      const ruta = `${profileId}/${formato.nombre}-${Date.now()}.jpg`

      const { error: errorSubida } = await supabase.storage
        .from('fotos')
        .upload(ruta, blob, { contentType: 'image/jpeg', upsert: true })

      if (errorSubida) throw errorSubida

      const { data } = supabase.storage.from('fotos').getPublicUrl(ruta)
      setUrl(data.publicUrl)
      onCambio?.(data.publicUrl)
      descartar()
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? `No se pudo subir la imagen: ${e.message}`
          : 'No se pudo subir la imagen.',
      )
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="campo">
      <span>{etiqueta}</span>

      {/* Lo que viaja con el formulario es la URL, no el archivo: la subida ya
          ocurrió y el guardado del perfil es una simple actualización de texto. */}
      <input type="hidden" name={name} value={url ?? ''} readOnly />

      {error && <div className="mensaje mensaje--error">{error}</div>}

      {imagen ? (
        <div className="recorte">
          <canvas
            ref={canvasRef}
            width={formato.anchoVista}
            height={altoVista}
            className={`recorte__lienzo${tipo === 'perfil' ? ' recorte__lienzo--redondo' : ''}`}
            onPointerDown={(e) => {
              arrastre.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!arrastre.current) return
              setOffset(limitar(e.clientX - arrastre.current.x, e.clientY - arrastre.current.y))
            }}
            onPointerUp={() => {
              arrastre.current = null
            }}
            onPointerCancel={() => {
              arrastre.current = null
            }}
          />

          <label className="recorte__zoom">
            <span>Acercar</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => cambiarZoom(Number(e.target.value))}
            />
          </label>

          <p className="recorte__ayuda">Arrastrá la imagen para encuadrarla.</p>

          <div className="admin__acciones">
            <button
              type="button"
              className="btn btn--primario btn--mini"
              onClick={confirmar}
              disabled={subiendo}
            >
              {subiendo ? 'Subiendo…' : 'Usar esta foto'}
            </button>
            <button
              type="button"
              className="btn btn--mini"
              onClick={descartar}
              disabled={subiendo}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="subir">
          {url ? (
            <Image
              src={url}
              alt=""
              width={Math.round(formato.anchoVista / 2)}
              height={Math.round(altoVista / 2)}
              /* Sin optimizar: es una miniatura del panel y la URL cambia en
                 cada subida, así que la caché del optimizador no se aprovecha
                 nunca y sólo se paga la transformación. */
              unoptimized
              className={`subir__previa${tipo === 'perfil' ? ' subir__previa--redonda' : ''}`}
            />
          ) : (
            <div
              className="subir__vacio"
              style={{ width: formato.anchoVista / 2, height: altoVista / 2 }}
              aria-hidden="true"
            >
              sin imagen
            </div>
          )}

          <div className="subir__acciones">
            <label className="btn btn--mini">
              {url ? 'Cambiar' : 'Subir imagen'}
              <input
                type="file"
                accept="image/*"
                onChange={elegirArchivo}
                className="visualmente-oculto"
              />
            </label>
            {url && (
              <button
                type="button"
                className="btn btn--mini"
                onClick={() => {
                  setUrl(null)
                  onCambio?.(null)
                }}
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      )}

      {ayuda && <small>{ayuda}</small>}
    </div>
  )
}
