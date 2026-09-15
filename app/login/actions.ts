'use server'

import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export async function iniciarSesion(_estado: { error?: string }, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const siguiente = String(formData.get('next') ?? '/admin')

  if (!email || !password) return { error: 'Completá email y contraseña.' }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // No se distingue "usuario inexistente" de "contraseña incorrecta" para no
  // confirmarle a nadie qué emails tienen cuenta.
  if (error) return { error: 'Email o contraseña incorrectos.' }

  redirect(siguiente.startsWith('/') ? siguiente : '/admin')
}

export async function cerrarSesion() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
