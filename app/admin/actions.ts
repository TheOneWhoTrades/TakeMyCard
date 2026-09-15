'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requerirAdmin } from '@/lib/auth'
import { normalizarSlug } from '@/lib/slug'
import { LINK_TIPOS, type LinkTipo } from '@/lib/types'

export type EstadoAccion = { error?: string; ok?: string }

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? '').trim()
const opcional = (fd: FormData, campo: string) => texto(fd, campo) || null

function leerPerfil(formData: FormData) {
  return {
    slug: normalizarSlug(texto(formData, 'slug')),
    nombre: texto(formData, 'nombre'),
    profesion: opcional(formData, 'profesion'),
    bio: opcional(formData, 'bio'),
    foto_url: opcional(formData, 'foto_url'),
    plan: texto(formData, 'plan') === 'premium' ? 'premium' : 'basico',
    auto_edicion_habilitada: formData.get('auto_edicion_habilitada') === 'on',
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
  // Los links caen por ON DELETE CASCADE.
  await supabase.from('profiles').delete().eq('id', id)

  revalidatePath('/admin')
  if (data?.slug) revalidatePath(`/${data.slug}`)
  redirect('/admin')
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

export async function actualizarLink(formData: FormData) {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const profileId = texto(formData, 'profile_id')

  await supabase
    .from('links')
    .update({
      label: texto(formData, 'label'),
      valor: texto(formData, 'valor'),
      tipo: texto(formData, 'tipo'),
      activo: formData.get('activo') === 'on',
    })
    .eq('id', id)

  await revalidarPerfilDeLink(supabase, profileId)
}

export async function eliminarLink(formData: FormData) {
  const { supabase } = await requerirAdmin()
  await supabase.from('links').delete().eq('id', texto(formData, 'id'))
  await revalidarPerfilDeLink(supabase, texto(formData, 'profile_id'))
}

/**
 * Mueve un link una posición arriba o abajo intercambiando el `orden` con su
 * vecino. Es más simple que arrastrar y alcanza para listas de 5-10 botones.
 */
export async function moverLink(formData: FormData) {
  const { supabase } = await requerirAdmin()
  const id = texto(formData, 'id')
  const profileId = texto(formData, 'profile_id')
  const direccion = texto(formData, 'direccion') === 'arriba' ? -1 : 1

  const { data: links } = await supabase
    .from('links')
    .select('id, orden')
    .eq('profile_id', profileId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  if (!links) return

  const indice = links.findIndex((l) => l.id === id)
  const destino = indice + direccion
  if (indice === -1 || destino < 0 || destino >= links.length) return

  // Se reescribe todo el orden en secuencia: así se normaliza aunque los
  // valores hayan quedado duplicados o con huecos por ediciones anteriores.
  const reordenados = [...links]
  ;[reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]]

  for (const [posicion, link] of reordenados.entries()) {
    await supabase.from('links').update({ orden: posicion + 1 }).eq('id', link.id)
  }

  await revalidarPerfilDeLink(supabase, profileId)
}
