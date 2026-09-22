'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { enviarEnlace, ingresarConClave, type EstadoIngreso } from './actions'

function Boton({ texto, enCurso }: { texto: string; enCurso: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? enCurso : texto}
    </button>
  )
}

/**
 * Dos formas de entrar al panel, con el enlace por email como opción principal.
 *
 * El orden no es casual: el cliente típico de este producto es un profesional
 * que va a entrar al panel cada varios meses. A esa frecuencia, una contraseña
 * se olvida siempre; el enlace por mail no.
 */
export function FormularioIngreso({ next }: { next: string }) {
  const [modo, setModo] = useState<'enlace' | 'clave'>('enlace')
  const [estadoEnlace, accionEnlace] = useActionState<EstadoIngreso, FormData>(enviarEnlace, {})
  const [estadoClave, accionClave] = useActionState<EstadoIngreso, FormData>(ingresarConClave, {})

  if (estadoEnlace.enviado) {
    return (
      <div className="mensaje mensaje--ok">
        <strong>Listo.</strong> Si ese email corresponde a una tarjeta nuestra, en menos de
        un minuto te llega un enlace para entrar. Se abre una sola vez y vence en una
        hora. Revisá también el correo no deseado.
      </div>
    )
  }

  return (
    <>
      <div className="pestañas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'enlace'}
          className={`pestaña${modo === 'enlace' ? ' pestaña--activa' : ''}`}
          onClick={() => setModo('enlace')}
        >
          Enlace por email
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'clave'}
          className={`pestaña${modo === 'clave' ? ' pestaña--activa' : ''}`}
          onClick={() => setModo('clave')}
        >
          Con contraseña
        </button>
      </div>

      {modo === 'enlace' ? (
        <form action={accionEnlace}>
          <input type="hidden" name="next" value={next} />
          {estadoEnlace.error && (
            <div className="mensaje mensaje--error">{estadoEnlace.error}</div>
          )}

          <label className="campo">
            <span>Tu email</span>
            <input type="email" name="email" autoComplete="email" required autoFocus />
            <small>Te mandamos un enlace para entrar sin contraseña.</small>
          </label>

          <Boton texto="Enviarme el enlace" enCurso="Enviando…" />
        </form>
      ) : (
        <form action={accionClave}>
          <input type="hidden" name="next" value={next} />
          {estadoClave.error && <div className="mensaje mensaje--error">{estadoClave.error}</div>}

          <label className="campo">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>

          <Boton texto="Ingresar" enCurso="Ingresando…" />
        </form>
      )}
    </>
  )
}
