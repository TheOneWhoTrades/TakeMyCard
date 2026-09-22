'use client'

import { useState } from 'react'
import { linkWhatsapp, MENSAJES } from '@/lib/marca'

/**
 * Formulario de contacto de la home.
 *
 * No manda nada a ningún servidor: arma el mensaje con lo que escribiste y abre
 * WhatsApp para que lo envíes vos. La decisión es doble.
 *
 * Del lado del producto: la conversación termina igual en WhatsApp, que es
 * donde se cierran las ventas acá. Un formulario que manda un mail a una casilla
 * que nadie mira es peor que no tenerlo.
 *
 * Del lado legal: al no recibir ni almacenar nada, el sitio comercial no trata
 * ningún dato personal de los interesados. No hay base que proteger, no hay
 * plazo de conservación que cumplir y no hay nada que se pueda filtrar.
 *
 * Por eso el botón es un `<a>` con el href ya armado y no un `submit`: funciona
 * aunque el JavaScript falle, y deja ver a dónde lleva antes de tocarlo.
 */
export function FormularioContacto() {
  const [nombre, setNombre] = useState('')
  const [actividad, setActividad] = useState('')
  const [mensaje, setMensaje] = useState('')

  const href = linkWhatsapp(MENSAJES.consulta({ nombre, actividad, mensaje }))

  return (
    <div className="contacto">
      <div className="contacto__campos">
        <label className="campo">
          <span>Tu nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan Pérez"
            autoComplete="name"
            maxLength={80}
          />
        </label>

        <label className="campo">
          <span>A qué te dedicás</span>
          <input
            type="text"
            value={actividad}
            onChange={(e) => setActividad(e.target.value)}
            placeholder="Contador · Estudio propio"
            maxLength={120}
          />
        </label>
      </div>

      <label className="campo">
        <span>¿Qué querés saber?</span>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Cuántas tarjetas necesito para el estudio, cómo es la entrega…"
          rows={3}
          maxLength={600}
        />
      </label>

      <a className="btn btn--primario btn--grande" href={href} target="_blank" rel="noopener noreferrer">
        Enviar por WhatsApp
      </a>

      <p className="contacto__nota">
        Se abre WhatsApp con el mensaje ya escrito: lo revisás y lo mandás vos. Nada de lo
        que escribas acá se envía ni se guarda en nuestros servidores.
      </p>
    </div>
  )
}
