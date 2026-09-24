'use server'

import { revalidatePath } from 'next/cache'
import { requerirCliente } from '@/lib/auth'
import { fotoValidaDePerfil, rutaDeFotoPropia } from '@/lib/fotos'
import { LINK_TIPOS, esLayout, type LinkTipo } from '@/lib/types'
import { PALETAS } from '@/lib/paletas'
import type { EstadoAccion } from '@/components/EditorLinks'

/**
 * Acciones del panel del cliente.
 *
 * Regla que vale para todas: el perfil sobre el que se opera NUNCA sale del
 * formulario, siempre se resuelve desde la sesión con `requerirCliente()`. Un
 * `profile_id` en un campo oculto es un campo que el navegador puede editar, y
 * confiar en él convertiría cada acción en «editá el perfil que quieras».
 *
 * Las políticas de RLS lo impedirían igual --es la defensa que de verdad
 * cuenta-- pero la acción no tiene por qué llegar a intentarlo.
 */

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? '').trim()
const opcional = (fd: FormData, campo: string) => texto(fd, campo) || null

function mensajeError(error: { code?: string; message: string }): string {
  if (error.code === '42501') return 'Tu plan no permite este cambio.'
  if (error.code === '23514') return 'Algún dato no tiene el formato esperado.'
  return 'No se pudo guardar. Probá de nuevo.'
}

// --- Perfil ------------------------------------------------------------------

export async function guardarPerfil(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase, profile } = await requerirCliente()

  const nombre = texto(formData, 'nombre')
  if (!nombre) return { error: 'El nombre no puede quedar vacío.' }

  const paleta = texto(formData, 'paleta')
  const layoutPedido = texto(formData, 'layout')

  const datos = {
    nombre,
    profesion: opcional(formData, 'profesion'),
    bio: opcional(formData, 'bio'),
    foto_url: fotoValidaDePerfil(opcional(formData, 'foto_url'), profile.id),
    // La portada se guarda siempre, aunque el plan no la muestre: así, si el
    // cliente sube de plan, no tiene que volver a cargarla.
    portada_url: fotoValidaDePerfil(opcional(formData, 'portada_url'), profile.id),
    paleta: PALETAS.some((p) => p.id === paleta) ? paleta : profile.paleta,
    // El layout propio es del Premium. Si el formulario trae otra cosa, se
    // ignora: un select editado a mano no compra un plan.
    layout:
      profile.plan === 'premium' && esLayout(layoutPedido) ? layoutPedido : profile.layout,
  }

  const { error } = await supabase.from('profiles').update(datos).eq('id', profile.id)
  if (error) return { error: mensajeError(error) }

  // Recién ahora se pueden borrar las versiones reemplazadas. Hacerlo cuando
  // se toca “Quitar” rompería la página pública si después se cancela el
  // formulario. Si Storage no responde, el perfil nuevo sigue siendo válido:
  // queda un archivo huérfano, pero nunca una foto rota.
  const fotosEnUso = new Set([datos.foto_url, datos.portada_url].filter(Boolean))
  const rutasAnteriores = [...new Set([profile.foto_url, profile.portada_url])]
    .filter((url): url is string => Boolean(url) && !fotosEnUso.has(url))
    .map((url) => rutaDeFotoPropia(url, profile.id))
    .filter((ruta): ruta is string => Boolean(ruta))

  if (rutasAnteriores.length) {
    await supabase.storage.from('fotos').remove(rutasAnteriores)
  }

  revalidatePath('/panel')
  revalidatePath(`/${profile.slug}`)
  return { ok: 'Listo, tu página ya está actualizada.' }
}

// --- Datos de contacto (vCard) ----------------------------------------------

export async function guardarContacto(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase, profile } = await requerirCliente()

  // Las redes viajan como pares sueltos y se arman acá: guardar el jsonb tal
  // como venga del formulario sería dejar que el navegador elija las claves.
  const redes: Record<string, string> = {}
  for (const red of ['instagram', 'linkedin', 'facebook', 'tiktok', 'youtube'] as const) {
    const valor = texto(formData, `red_${red}`)
    if (valor) redes[red] = valor
  }

  const { error } = await supabase.from('contact_info').upsert(
    {
      profile_id: profile.id,
      telefono: opcional(formData, 'telefono'),
      email: opcional(formData, 'email'),
      direccion: opcional(formData, 'direccion'),
      redes,
    },
    { onConflict: 'profile_id' },
  )

  if (error) return { error: mensajeError(error) }

  revalidatePath('/panel')
  revalidatePath(`/${profile.slug}`)
  return { ok: 'Datos de contacto guardados.' }
}

// --- Links -------------------------------------------------------------------

async function revalidar(slug: string) {
  revalidatePath('/panel')
  revalidatePath(`/${slug}`)
}

export async function crearLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase, profile } = await requerirCliente()

  const tipo = texto(formData, 'tipo') as LinkTipo
  const label = texto(formData, 'label')
  const valor = texto(formData, 'valor')

  if (!LINK_TIPOS.includes(tipo)) return { error: 'Elegí un tipo de botón válido.' }
  if (!label) return { error: 'Poné un texto para el botón.' }
  if (!valor) return { error: 'Falta el dato del botón (número, usuario o dirección).' }

  const { data: ultimo } = await supabase
    .from('links')
    .select('orden')
    .eq('profile_id', profile.id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('links').insert({
    profile_id: profile.id,
    tipo,
    label,
    valor,
    orden: (ultimo?.orden ?? 0) + 1,
    activo: true,
  })

  if (error) return { error: mensajeError(error) }

  await revalidar(profile.slug)
  return { ok: 'Botón agregado.' }
}

export async function actualizarLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase, profile } = await requerirCliente()
  const tipo = texto(formData, 'tipo') as LinkTipo
  const label = texto(formData, 'label')
  const valor = texto(formData, 'valor')

  if (!LINK_TIPOS.includes(tipo)) return { error: 'Elegí un tipo de botón válido.' }
  if (!label || !valor) return { error: 'Completá el texto y el dato del botón.' }

  const { error } = await supabase
    .from('links')
    .update({
      label,
      valor,
      tipo,
      activo: formData.get('activo') === 'on',
    })
    .eq('id', texto(formData, 'id'))
    // El filtro por perfil no sobra aunque RLS ya lo garantice: deja la
    // intención escrita en la consulta y no sólo en la base.
    .eq('profile_id', profile.id)

  if (error) return { error: mensajeError(error) }
  await revalidar(profile.slug)
  return { ok: 'Botón guardado.' }
}

export async function eliminarLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase, profile } = await requerirCliente()
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', texto(formData, 'id'))
    .eq('profile_id', profile.id)
  if (error) return { error: mensajeError(error) }
  await revalidar(profile.slug)
  return { ok: 'Botón eliminado.' }
}

export async function moverLink(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const { supabase, profile } = await requerirCliente()
  const id = texto(formData, 'id')
  const direccion = texto(formData, 'direccion') === 'arriba' ? -1 : 1

  const { data: links, error: errorLectura } = await supabase
    .from('links')
    .select('id, orden')
    .eq('profile_id', profile.id)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  if (errorLectura || !links) return { error: 'No pudimos leer los botones. Probá de nuevo.' }

  const indice = links.findIndex((l) => l.id === id)
  const destino = indice + direccion
  if (indice === -1 || destino < 0 || destino >= links.length) return {}

  const reordenados = [...links]
  ;[reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]]

  for (const [posicion, link] of reordenados.entries()) {
    const { error } = await supabase
      .from('links')
      .update({ orden: posicion + 1 })
      .eq('id', link.id)
      .eq('profile_id', profile.id)
    if (error) return { error: mensajeError(error) }
  }

  await revalidar(profile.slug)
  return { ok: 'Orden actualizado.' }
}
