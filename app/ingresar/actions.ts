'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { siteUrl } from '@/lib/env'
import { supabaseServer } from '@/lib/supabase/server'

export type EstadoIngreso = { error?: string; enviado?: boolean }

/**
 * Sólo se aceptan destinos internos. Sin esta comprobación, un link del tipo
 * /ingresar?next=https://sitio-falso.com convierte nuestro login en un
 * trampolín de phishing: la persona ve nuestro dominio, ingresa, y termina en
 * otro lado creyendo que sigue en el nuestro.
 */
function destinoSeguro(valor: string | undefined): string {
  if (!valor) return '/panel'
  // `//otro.com` y `/\otro.com` también son absolutos para el navegador.
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return '/panel'
  return valor
}

/**
 * Ingreso con enlace de un solo uso.
 *
 * Es el camino recomendado para los clientes: no hay contraseña que recordar,
 * que se repita en otros sitios ni que podamos filtrar, y el acceso caduca solo.
 */
export async function enviarEnlace(
  _estado: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const siguiente = destinoSeguro(String(formData.get('next') ?? ''))

  if (!email || !email.includes('@')) return { error: 'Escribí un email válido.' }

  const supabase = await supabaseServer()

  // La URL de retorno se arma desde el host del pedido cuando hay uno: así el
  // enlace funciona igual en producción, en las previews de Vercel y en local
  // sin tener que cambiar configuración.
  const host = (await headers()).get('host')
  const base = host ? `https://${host}` : siteUrl()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Nadie se crea una cuenta solo: los perfiles los damos de alta nosotros
      // al vender. Si el mail no corresponde a un cliente, no pasa nada.
      shouldCreateUser: false,
      emailRedirectTo: `${base}/auth/callback?next=${encodeURIComponent(siguiente)}`,
    },
  })

  // Se responde lo mismo exista o no el email. Contestar "ese mail no tiene
  // cuenta" le confirmaría a cualquiera quiénes son nuestros clientes, que es
  // justamente lo que no queremos publicar.
  if (error && !/user not found|signups not allowed/i.test(error.message)) {
    return { error: 'No pudimos enviar el enlace. Probá de nuevo en un minuto.' }
  }

  return { enviado: true }
}

/** Ingreso con contraseña, para quien prefiera no depender del email. */
export async function ingresarConClave(
  _estado: EstadoIngreso,
  formData: FormData,
): Promise<EstadoIngreso> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const siguiente = destinoSeguro(String(formData.get('next') ?? ''))

  if (!email || !password) return { error: 'Completá email y contraseña.' }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // No se distingue "usuario inexistente" de "contraseña incorrecta" para no
  // confirmarle a nadie qué emails tienen cuenta.
  if (error) return { error: 'Email o contraseña incorrectos.' }

  redirect(siguiente)
}

export async function cerrarSesionCliente() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/ingresar')
}
