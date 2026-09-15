'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { Profile } from '@/lib/types'
import { normalizarSlug } from '@/lib/slug'
import { actualizarPerfil, crearPerfil, type EstadoAccion } from './actions'

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? 'Guardando…' : texto}
    </button>
  )
}

export function FormularioPerfil({ profile }: { profile?: Profile }) {
  const esNuevo = !profile
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    esNuevo ? crearPerfil : actualizarPerfil,
    {},
  )
  const [slug, setSlug] = useState(profile?.slug ?? '')

  return (
    <form action={accion} className="tarjeta">
      {profile && <input type="hidden" name="id" value={profile.id} />}

      {estado.error && <div className="mensaje mensaje--error">{estado.error}</div>}
      {estado.ok && <div className="mensaje mensaje--ok">{estado.ok}</div>}

      <div className="fila">
        <label className="campo">
          <span>Nombre *</span>
          <input type="text" name="nombre" defaultValue={profile?.nombre} required />
        </label>

        <label className="campo">
          <span>Slug * (la URL de la tarjeta)</span>
          <input
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={(e) => setSlug(normalizarSlug(e.target.value))}
            placeholder="dra-lucia-fernandez"
            required
          />
          <small>
            Queda como <code>/{slug || 'tu-slug'}</code>. Ojo:{' '}
            <strong>cambiarlo rompe las tarjetas ya entregadas.</strong>
          </small>
        </label>
      </div>

      <label className="campo">
        <span>Profesión / título</span>
        <input
          type="text"
          name="profesion"
          defaultValue={profile?.profesion ?? ''}
          placeholder="Odontóloga · Ortodoncia"
        />
      </label>

      <label className="campo">
        <span>Bio corta</span>
        <textarea name="bio" defaultValue={profile?.bio ?? ''} maxLength={500} />
        <small>Máximo 500 caracteres.</small>
      </label>

      <label className="campo">
        <span>URL de la foto</span>
        <input
          type="url"
          name="foto_url"
          defaultValue={profile?.foto_url ?? ''}
          placeholder="https://…/storage/v1/object/public/fotos/…"
        />
        <small>Subí la imagen al bucket «fotos» en Supabase y pegá acá la URL pública.</small>
      </label>

      <div className="fila">
        <label className="campo">
          <span>Plan</span>
          <select name="plan" defaultValue={profile?.plan ?? 'basico'}>
            <option value="basico">Básico</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <label className="campo campo--check">
        <input type="checkbox" name="activo" defaultChecked={profile?.activo ?? true} />
        <span>
          Perfil activo
          <br />
          <small>Si se desactiva, la página pública muestra un aviso en vez del perfil.</small>
        </span>
      </label>

      <label className="campo campo--check">
        <input
          type="checkbox"
          name="auto_edicion_habilitada"
          defaultChecked={profile?.auto_edicion_habilitada ?? false}
        />
        <span>
          Auto-edición habilitada
          <br />
          <small>
            Reservado para el panel de cliente (todavía no construido). Sin una cuenta
            vinculada al perfil, no tiene efecto.
          </small>
        </span>
      </label>

      <Guardar texto={esNuevo ? 'Crear perfil' : 'Guardar cambios'} />
    </form>
  )
}
