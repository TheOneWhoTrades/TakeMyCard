'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { SelectorPaleta } from '@/components/SelectorPaleta'
import { SubirFoto } from '@/components/SubirFoto'
import type { EstadoAccion } from '@/components/EditorLinks'
import { obtenerPaleta, variablesDePaleta } from '@/lib/paletas'
import { CAPACIDADES, LAYOUTS, type Profile } from '@/lib/types'
import { guardarPerfil } from './actions'

function Guardar() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  )
}

const NOMBRE_LAYOUT: Record<string, { titulo: string; para: string }> = {
  estandar:  { titulo: 'Estándar',  para: 'Columna centrada, foto redonda. La más sobria.' },
  editorial: { titulo: 'Editorial', para: 'Portada a lo ancho y tu nombre como título de diario.' },
  retrato:   { titulo: 'Retrato',   para: 'Tu foto grande al costado del texto.' },
  vidriera:  { titulo: 'Vidriera',  para: 'Portada con tu nombre encima y botones en fichas.' },
}

/**
 * Edición de la página, con vista previa al lado.
 *
 * La previa no es un adorno: el cliente edita desde el teléfono, mientras
 * atiende, y ver el cambio antes de guardar es lo que evita la consulta «¿cómo
 * me quedó?» por WhatsApp. Refleja el texto, el color y las fotos en vivo; el
 * layout completo se ve con «Ver mi página».
 */
export function EditorPerfil({ profile }: { profile: Profile }) {
  const [estado, accion] = useActionState<EstadoAccion, FormData>(guardarPerfil, {})
  const capacidades = CAPACIDADES[profile.plan]

  const [nombre, setNombre] = useState(profile.nombre)
  const [profesion, setProfesion] = useState(profile.profesion ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [paleta, setPaleta] = useState(profile.paleta)

  const colores = obtenerPaleta(paleta)

  return (
    <form action={accion} className="editor">
      <div className="editor__campos">
        {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
        {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

        <div className="tarjeta">
          <h3>Tus datos</h3>

          <label className="campo">
            <span>Nombre *</span>
            <input
              type="text"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              maxLength={120}
            />
          </label>

          <label className="campo">
            <span>Profesión o cargo</span>
            <input
              type="text"
              name="profesion"
              value={profesion}
              onChange={(e) => setProfesion(e.target.value)}
              placeholder="Contador Público · Estudio Pérez"
              maxLength={160}
            />
          </label>

          <label className="campo">
            <span>Presentación</span>
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <small>{500 - bio.length} caracteres disponibles.</small>
          </label>
        </div>

        <div className="tarjeta">
          <h3>Fotos</h3>

          <SubirFoto
            profileId={profile.id}
            name="foto_url"
            tipo="perfil"
            valorInicial={profile.foto_url}
            etiqueta="Foto de perfil"
            ayuda="Cuadrada. Se recorta acá mismo antes de subirla."
          />

          {capacidades.portada ? (
            <SubirFoto
              profileId={profile.id}
              name="portada_url"
              tipo="portada"
              valorInicial={profile.portada_url}
              etiqueta="Foto de portada"
              ayuda="Apaisada, va arriba de todo. Es también la imagen que se ve al compartir tu página."
            />
          ) : (
            // El valor se conserva aunque el plan no la muestre: si sube de
            // plan, la portada ya cargada aparece sola.
            <input type="hidden" name="portada_url" value={profile.portada_url ?? ''} />
          )}
        </div>

        <div className="tarjeta">
          <SelectorPaleta valor={profile.paleta} onCambio={setPaleta} />
        </div>

        {capacidades.landingPropia && (
          <div className="tarjeta">
            <fieldset className="paletas">
              <legend>Diseño de tu página</legend>
              <div className="layouts">
                {LAYOUTS.map((id) => (
                  <label key={id} className="layout">
                    <input
                      type="radio"
                      name="layout"
                      value={id}
                      defaultChecked={profile.layout === id}
                    />
                    <span>
                      <strong>{NOMBRE_LAYOUT[id].titulo}</strong>
                      <small>{NOMBRE_LAYOUT[id].para}</small>
                    </span>
                  </label>
                ))}
              </div>
              <small>
                Los cuatro muestran la misma información: lo que cambia es cómo está
                puesta. Guardá y tocá «Ver mi página» para verlo entero.
              </small>
            </fieldset>
          </div>
        )}

        <Guardar />
      </div>

      {/* --- Vista previa ------------------------------------------------- */}
      <aside className="editor__previa">
        <p className="volanta">Vista previa</p>
        <div className="previa" style={variablesDePaleta(colores)}>
          {capacidades.portada && profile.portada_url && (
            <Image
              src={profile.portada_url}
              alt=""
              width={320}
              height={107}
              unoptimized
              className="previa__portada"
            />
          )}
          <div className="previa__cuerpo">
            {profile.foto_url ? (
              <Image
                src={profile.foto_url}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="previa__foto"
              />
            ) : (
              <div className="previa__inicial" aria-hidden="true">
                {nombre.trim().charAt(0).toUpperCase() || '·'}
              </div>
            )}
            <p className="previa__nombre">{nombre || 'Tu nombre'}</p>
            {profesion && <p className="previa__profesion">{profesion}</p>}
            {bio && <p className="previa__bio">{bio}</p>}
            <span className="previa__boton">Guardar contacto</span>
          </div>
        </div>
        <p className="previa__nota">
          Aproximada. La página real la ves con «Ver mi página», arriba a la derecha.
        </p>
      </aside>
    </form>
  )
}
