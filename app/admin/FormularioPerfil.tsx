'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { SelectorPaleta } from '@/components/SelectorPaleta'
import { SubirFoto } from '@/components/SubirFoto'
import type { EstadoAccion } from '@/components/EditorLinks'
import { normalizarSlug } from '@/lib/slug'
import { LAYOUTS, PLANES_ID, type Profile } from '@/lib/types'
import { actualizarPerfil, crearPerfil } from './actions'

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primario" disabled={pending}>
      {pending ? 'Guardando…' : texto}
    </button>
  )
}

const NOMBRE_PLAN: Record<string, string> = {
  basico: 'Básico — lo editamos nosotros',
  plus: 'Plus — el cliente se autoedita, con portada',
  premium: 'Premium — además, analítica y layout propio',
}

export function FormularioPerfil({ profile }: { profile?: Profile }) {
  const esNuevo = !profile
  const [estado, accion] = useActionState<EstadoAccion, FormData>(
    esNuevo ? crearPerfil : actualizarPerfil,
    {},
  )
  const [slug, setSlug] = useState(profile?.slug ?? '')
  const [plan, setPlan] = useState<string>(profile?.plan ?? 'basico')

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
            placeholder="estudio-perez"
            required
          />
          <small>
            Queda como <code>/{slug || 'tu-slug'}</code>. Se puede cambiar: la tarjeta
            física apunta al código corto, no al slug.
          </small>
        </label>
      </div>

      <label className="campo">
        <span>Profesión / cargo</span>
        <input
          type="text"
          name="profesion"
          defaultValue={profile?.profesion ?? ''}
          placeholder="Contador Público · Estudio Pérez"
        />
      </label>

      <label className="campo">
        <span>Bio corta</span>
        <textarea name="bio" defaultValue={profile?.bio ?? ''} maxLength={500} />
        <small>Máximo 500 caracteres.</small>
      </label>

      {/* La subida necesita la carpeta del perfil, que sólo existe una vez
          creado. En el alta se cargan después, desde la pantalla de edición. */}
      {profile ? (
        <div className="fila">
          <SubirFoto
            profileId={profile.id}
            name="foto_url"
            tipo="perfil"
            valorInicial={profile.foto_url}
            etiqueta="Foto de perfil"
          />
          <SubirFoto
            profileId={profile.id}
            name="portada_url"
            tipo="portada"
            valorInicial={profile.portada_url}
            etiqueta="Foto de portada"
            ayuda="Sólo se muestra en Plus y Premium."
          />
        </div>
      ) : (
        <p className="vacio" style={{ padding: 0 }}>
          Las fotos se cargan después de crear el perfil.
        </p>
      )}

      <SelectorPaleta valor={profile?.paleta ?? 'bosque'} />

      <div className="fila">
        <label className="campo">
          <span>Plan</span>
          <select name="plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLANES_ID.map((id) => (
              <option key={id} value={id}>
                {NOMBRE_PLAN[id]}
              </option>
            ))}
          </select>
          <small>
            El plan es el switch: habilita portada, panel del cliente, analítica y layout
            propio.
          </small>
        </label>

        <label className="campo">
          <span>Diseño de la página</span>
          <select name="layout" defaultValue={profile?.layout ?? 'estandar'} disabled={plan !== 'premium'}>
            {LAYOUTS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <small>
            {plan === 'premium'
              ? 'Las cuatro muestran la misma información con distinto diseño.'
              : 'Los layouts propios son del Premium.'}
          </small>
        </label>
      </div>

      {/* Sin esto, al guardar un perfil que no es premium el select deshabilitado
          no manda nada y el layout se perdería. */}
      {plan !== 'premium' && (
        <input type="hidden" name="layout" value={profile?.layout ?? 'estandar'} />
      )}

      <label className="campo campo--check">
        <input type="checkbox" name="activo" defaultChecked={profile?.activo ?? true} />
        <span>
          Perfil activo
          <br />
          <small>
            Si se desactiva, la página pública muestra un aviso en vez del perfil. Es lo
            que corresponde hacer ante una falta de pago: los datos quedan intactos.
          </small>
        </span>
      </label>

      <Guardar texto={esNuevo ? 'Crear perfil' : 'Guardar cambios'} />
    </form>
  )
}
