'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { siteUrl } from '@/lib/env'
import { supabaseServer } from '@/lib/supabase/server'

export type EstadoAlta = { error?: string; confirmar?: boolean }

/** Mínimo propio, más exigente que el de Supabase (6). */
const MINIMO_CLAVE = 8

/**
 * Alta de cuenta del cliente.
 *
 * Crear la cuenta NO da acceso a nada. Una cuenta recién creada no tiene perfil
 * vinculado, y todas las políticas de RLS parten de
 * `profiles.user_id = auth.uid()`: sin esa fila no puede leer ni escribir nada,
 * ni siquiera saber qué perfiles existen. El alta real --vincular la cuenta con
 * un perfil y asignarle plan-- la hacemos nosotros desde el backoffice.
 *
 * Por eso abrir el registro es seguro: lo peor que puede hacer alguien es
 * crearse una cuenta inerte. La alternativa --un formulario de "solicitud" con
 * nombre, teléfono y mensaje-- nos obligaría a guardar datos personales de
 * gente que quizás nunca sea cliente, que es justo lo que el resto del sitio
 * evita.
 */
export async function crearCuenta(_estado: EstadoAlta, formData: FormData): Promise<EstadoAlta> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const repetida = String(formData.get('password2') ?? '')

  if (!email || !email.includes('@')) return { error: 'Escribí un email válido.' }
  if (password.length < MINIMO_CLAVE) {
    return { error: `La contraseña tiene que tener al menos ${MINIMO_CLAVE} caracteres.` }
  }
  if (password !== repetida) return { error: 'Las dos contraseñas no coinciden.' }

  const supabase = await supabaseServer()

  const host = (await headers()).get('host')
  const base = host ? `https://${host}` : siteUrl()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${base}/auth/callback?next=/panel` },
  })

  if (error) {
    // El mensaje se generaliza a propósito. Los de Supabase distinguen "ese
    // email ya existe" de otros fallos, y repetirlo acá convertiría este
    // formulario en una forma de averiguar quiénes son nuestros clientes.
    return { error: 'No pudimos crear la cuenta. Revisá el email y probá de nuevo.' }
  }

  // Con la confirmación por email activada (lo recomendable), Supabase devuelve
  // usuario pero no sesión: la cuenta existe y falta que el cliente confirme.
  if (!data.session) return { confirmar: true }

  redirect('/panel')
}
