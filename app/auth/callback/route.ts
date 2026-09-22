import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * Aterrizaje del enlace de un solo uso que llega por email.
 *
 * Supabase manda a la persona acá con un `code` en la URL; este handler lo
 * canjea por una sesión, deja las cookies puestas y la manda al panel.
 *
 * El destino se valida: sin eso, un mail con
 * /auth/callback?next=https://sitio-falso.com dejaría a alguien recién
 * autenticado en un sitio ajeno, creyendo que sigue en el nuestro.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const solicitado = searchParams.get('next') ?? '/panel'

  const destino =
    solicitado.startsWith('/') && !solicitado.startsWith('//') && !solicitado.startsWith('/\\')
      ? solicitado
      : '/panel'

  if (!code) {
    return NextResponse.redirect(`${origin}/ingresar?error=enlace-invalido`)
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/ingresar?error=enlace-invalido`)
  }

  return NextResponse.redirect(`${origin}${destino}`)
}
