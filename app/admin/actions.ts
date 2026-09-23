'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { EstadoAccion } from '@/components/EditorLinks'
import { requerirAdmin } from '@/lib/auth'
import { PALETAS } from '@/lib/paletas'
import { normalizarSlug } from '@/lib/slug'
import { esLayout, esPlan, LINK_TIPOS, type LinkTipo } from '@/lib/types'

export type { EstadoAccion }

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? '').trim()
const opcional = (fd: FormData, campo: string) => texto(fd, campo) || null

function leerPerfil(formData: FormData) {
  const plan = texto(formData, 'plan')
  const paleta = texto(formData, 'paleta')
  const layout = texto(formData, 'layout')

  return {
    slug: normalizarSlug(texto(formData, 'slug')),
    nombre: texto(formData, 'nombre'),
    profesion: opcional(formData, 'profesion'),
    bio: opcional(formData, 'bio'),
    foto_url: opcional(formData, 'foto_url'),
    portada_url: opcional(formData, 'portada_url'),
    plan: esPlan(plan) ? plan : 'basico',
    paleta: PALETAS.some((p) => p.id === paleta) ? paleta : 'bosque',
    layout: esLayout(layout) ? layout : 'estandar',
    activo: formData.get('activo') === 'on',
  }
}

/** Traduce los errores de Postgres a algo que se entienda en el panel. */
function mensajeError(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Ya existe un perfil con ese slug. Elegí otro.'
  if (error.code === '23514') return 'Algún dato no cumple el formato esperado (revisá el slug).'
  if (error.code === '42501') return 'Tu cuenta no tiene permisos para esta operación.'
  return error.message
}

// --- Perfiles ----------------------------------------------------------------

export async function crearPerfil(_estado: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const datos = leerPerfil(formData)

  if (!datos.nombre) return { error: 'El nombre es obligatorio.' }
  if (!datos.slug) return { error: 'El slug es obligatorio.' }
  if (datos.slug.length < 3) return { error: 'El slug tiene que tener al menos 3 caracteres.' }

  const { data, error } = await supabase.from('profiles').insert(datos).select('id').single()
  if (error) return { error: mensajeError(error) }

  revalidatePath('/admin')
  redirect(`/admin/${data.id}?creado=1`)
}

export async function actualizarPerfil(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const datos = leerPerfil(formData)

  if (!datos.nombre) return { error: 'El nombre es obligatorio.' }
  if (!datos.slug) return { error: 'El slug es obligatorio.' }

  const { data: previo } = await supabase.from('profiles').select('slug').eq('id', id).single()

  const { error } = await supabase.from('profiles').update(datos).eq('id', id)
  if (error) return { error: mensajeError(error) }

  revalidatePath('/admin')
  revalidatePath(`/admin/${id}`)
  revalidatePath(`/${datos.slug}`)
  if (previo?.slug && previo.slug !== datos.slug) revalidatePath(`/${previo.slug}`)

  return { ok: 'Perfil guardado.' }
}

/**
 * Asocia (o desasocia) la cuenta del cliente con su perfil, buscándola por
 * email. La búsqueda la hace un RPC en la base: desde la app no se puede leer
 * `auth.users` con la clave pública, y traer la clave de servicio al servidor
 * web para esto sería cambiar una molestia por un riesgo grande.
 */
export async function vincularCuenta(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const email = texto(formData, 'email')

  const { data, error } = await supabase.rpc('vincular_cuenta', {
    p_profile_id: id,
    p_email: email,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/${id}`)
  return {
    ok: data === 'desvinculado' ? 'Cuenta desvinculada.' : 'Cuenta vinculada al perfil.',
  }
}

export async function alternarActivo(formData: FormData) {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const activo = texto(formData, 'activo') === 'true'

  const { data } = await supabase
    .from('profiles')
    .update({ activo: !activo })
    .eq('id', id)
    .select('slug')
    .single()

  revalidatePath('/admin')
  revalidatePath(`/admin/${id}`)
  if (data?.slug) revalidatePath(`/${data.slug}`)
}

export async function eliminarPerfil(formData: FormData) {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')

  const { data } = await supabase.from('profiles').select('slug').eq('id', id).single()
  // Los links, el contacto, los eventos y las tarjetas caen por ON DELETE CASCADE.
  await supabase.from('profiles').delete().eq('id', id)

  revalidatePath('/admin')
  if (data?.slug) revalidatePath(`/${data.slug}`)
  redirect('/admin')
}

// --- Datos de contacto -------------------------------------------------------

export async function guardarContacto(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const profileId = texto(formData, 'profile_id')

  const redes: Record<string, string> = {}
  for (const red of ['instagram', 'linkedin', 'facebook', 'tiktok', 'youtube'] as const) {
    const valor = texto(formData, `red_${red}`)
    if (valor) redes[red] = valor
  }

  const { error } = await supabase.from('contact_info').upsert(
    {
      profile_id: profileId,
      telefono: opcional(formData, 'telefono'),
      email: opcional(formData, 'email'),
      direccion: opcional(formData, 'direccion'),
      redes,
    },
    { onConflict: 'profile_id' },
  )

  if (error) return { error: mensajeError(error) }

  const { data } = await supabase.from('profiles').select('slug').eq('id', profileId).single()
  revalidatePath(`/admin/${profileId}`)
  if (data?.slug) revalidatePath(`/${data.slug}`)

  return { ok: 'Datos de contacto guardados.' }
}

// --- Tarjetas físicas --------------------------------------------------------

export async function registrarTarjeta(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const profileId = texto(formData, 'profile_id')

  const { error } = await supabase.from('cards').insert({
    profile_id: profileId,
    entregada_el: opcional(formData, 'entregada_el'),
    reposicion: formData.get('reposicion') === 'on',
    nota: opcional(formData, 'nota'),
  })

  if (error) return { error: mensajeError(error) }

  revalidatePath(`/admin/${profileId}`)
  return { ok: 'Tarjeta registrada.' }
}

export async function eliminarTarjeta(formData: FormData) {
  const { supabase } = await requerirAdmin()
  await supabase.from('cards').delete().eq('id', texto(formData, 'id'))
  revalidatePath(`/admin/${texto(formData, 'profile_id')}`)
}

// --- Links -------------------------------------------------------------------

async function revalidarPerfilDeLink(
  supabase: Awaited<ReturnType<typeof requerirAdmin>>['supabase'],
  profileId: string,
) {
  const { data } = await supabase.from('profiles').select('slug').eq('id', profileId).single()
  revalidatePath(`/admin/${profileId}`)
  if (data?.slug) revalidatePath(`/${data.slug}`)
}

export async function crearLink(_estado: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()

  const profileId = texto(formData, 'profile_id')
  const tipo = texto(formData, 'tipo') as LinkTipo
  const label = texto(formData, 'label')
  const valor = texto(formData, 'valor')

  if (!LINK_TIPOS.includes(tipo)) return { error: 'Tipo de link inválido.' }
  if (!label) return { error: 'Poné un texto para el botón.' }
  if (!valor) return { error: 'Falta el valor del link.' }

  // El link nuevo va al final de la lista.
  const { data: ultimo } = await supabase
    .from('links')
    .select('orden')
    .eq('profile_id', profileId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('links').insert({
    profile_id: profileId,
    tipo,
    label,
    valor,
    orden: (ultimo?.orden ?? 0) + 1,
    activo: true,
  })

  if (error) return { error: mensajeError(error) }

  await revalidarPerfilDeLink(supabase, profileId)
  return { ok: 'Link agregado.' }
}

export async function actualizarLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const profileId = texto(formData, 'profile_id')
  const tipo = texto(formData, 'tipo') as LinkTipo
  const label = texto(formData, 'label')
  const valor = texto(formData, 'valor')

  if (!LINK_TIPOS.includes(tipo)) return { error: 'Tipo de link inválido.' }
  if (!label || !valor) return { error: 'Completá el texto y el dato del botón.' }

  const { error } = await supabase
    .from('links')
    .update({
      label,
      valor,
      tipo,
      activo: formData.get('activo') === 'on',
    })
    .eq('id', id)

  if (error) return { error: mensajeError(error) }
  await revalidarPerfilDeLink(supabase, profileId)
  return { ok: 'Botón guardado.' }
}

export async function eliminarLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const profileId = texto(formData, 'profile_id')
  const { error } = await supabase.from('links').delete().eq('id', texto(formData, 'id'))
  if (error) return { error: mensajeError(error) }
  await revalidarPerfilDeLink(supabase, profileId)
  return { ok: 'Botón eliminado.' }
}

/**
 * Mueve un link una posición arriba o abajo intercambiando el `orden` con su
 * vecino. Es más simple que arrastrar y alcanza para listas de 5-10 botones.
 */
export async function moverLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const profileId = texto(formData, 'profile_id')
  const direccion = texto(formData, 'direccion') === 'arriba' ? -1 : 1

  const { data: links, error: errorLectura } = await supabase
    .from('links')
    .select('id, orden')
    .eq('profile_id', profileId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  if (errorLectura || !links) return { error: 'No pudimos leer los botones. Probá de nuevo.' }

  const indice = links.findIndex((l) => l.id === id)
  const destino = indice + direccion
  if (indice === -1 || destino < 0 || destino >= links.length) return {}

  // Se reescribe todo el orden en secuencia: así se normaliza aunque los
  // valores hayan quedado duplicados o con huecos por ediciones anteriores.
  const reordenados = [...links]
  ;[reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]]

  for (const [posicion, link] of reordenados.entries()) {
    const { error } = await supabase.from('links').update({ orden: posicion + 1 }).eq('id', link.id)
    if (error) return { error: mensajeError(error) }
  }

  await revalidarPerfilDeLink(supabase, profileId)
  return { ok: 'Orden actualizado.' }
}
