import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Refresca el token de Supabase en cada request para que la sesión de los
 * paneles no expire mientras se usa, y corta el paso a /admin y /panel sin
 * sesión.
 *
 * Esto es sólo comodidad de UX: la autorización de verdad la hacen las
 * políticas de RLS en la base.
 */

/** Rutas que exigen sesión, con el login que le corresponde a cada una. */
const PROTEGIDAS: { prefijo: string; login: string }[] = [
  { prefijo: '/admin', login: '/login' },
  { prefijo: '/panel', login: '/ingresar' },
]
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protegida = PROTEGIDAS.find((r) => request.nextUrl.pathname.startsWith(r.prefijo))

  if (!user && protegida) {
    const login = request.nextUrl.clone()
    login.pathname = protegida.login
    login.searchParams.set('next', request.nextUrl.pathname)
    // Se limpia todo lo demás: sin esto, los parámetros de la URL original
    // viajan al login y pueden terminar en los registros del servidor.
    for (const clave of [...login.searchParams.keys()]) {
      if (clave !== 'next') login.searchParams.delete(clave)
    }
    return NextResponse.redirect(login)
  }

  return response
}

export const config = {
  // Sólo donde hace falta sesión. Las páginas públicas /[slug] y el enlace corto
  // /t/... quedan fuera para que sirvan sin el costo de una verificación de auth
  // por request: son las que tienen que abrir instantáneo con la tarjeta.
  matcher: ['/admin/:path*', '/panel/:path*', '/acceso/:path*', '/login', '/ingresar'],
}
