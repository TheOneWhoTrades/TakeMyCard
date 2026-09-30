import { NextResponse, type NextRequest } from 'next/server'
import { destinoSeguro } from '@/lib/destino'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * Aterrizaje del enlace de un solo uso que llega por email.
 *
 * Supabase manda a la persona acá después de verificar el token. Este handler
 * canjea lo que venga en la URL por una sesión, deja las cookies puestas y la
 * manda al panel.
 *
 * El destino se valida: sin eso, un mail con
 * /auth/callback?next=https://sitio-falso.com dejaría a alguien recién
 * autenticado en un sitio ajeno, creyendo que sigue en el nuestro.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const destino = destinoSeguro(searchParams.get('next'), '/panel')
  const esAlta = searchParams.get('alta') === '1'

  const invalido = `${origin}/ingresar?error=enlace-invalido`

  // 1. Supabase verificó y falló, y lo dice en la propia URL: el token venció,
  //    ya se había usado, o el destino no estaba permitido. No hay nada que
  //    canjear y el enlace efectivamente no sirve.
  if (searchParams.has('error') || searchParams.has('error_code')) {
    return NextResponse.redirect(invalido)
  }

  const supabase = await supabaseServer()

  // 2. Camino normal (PKCE): el `code` se canjea contra el verificador que
  //    quedó en una cookie cuando se pidió el enlace.
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${destino}`)
  }

  // 3. Llegamos sin poder abrir sesión, pero sin que Supabase reportara error.
  //
  //    Pasa cuando el mail se abre en un navegador distinto del que pidió el
  //    enlace --el cliente crea la cuenta en la computadora y confirma desde el
  //    teléfono, o el mail abre su propio navegador embebido--: la cookie con
  //    el verificador quedó del otro lado y el canje no puede completarse.
  //
  //    Para una confirmación de alta eso NO es un fracaso: Supabase marca el
  //    email como confirmado *antes* de redirigir acá, así que la cuenta quedó
  //    lista y lo único que falta es iniciar sesión. Decirle "el enlace venció"
  //    a alguien cuya cuenta acaba de quedar confirmada lo manda a pedir un
  //    enlace nuevo para arreglar algo que ya está bien.
  if (esAlta) {
    return NextResponse.redirect(`${origin}/ingresar?aviso=cuenta-confirmada`)
  }

  return NextResponse.redirect(invalido)
}
