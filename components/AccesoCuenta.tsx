'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

/**
 * Acceso a la cuenta en el encabezado de la home: los botones para entrar o
 * crear una cuenta, o el saludo si ya hay una sesión abierta en este navegador.
 *
 * La sesión se lee acá, en el navegador, y no al renderizar en el servidor. La
 * home es estática y Vercel la sirve igual a todo el mundo desde el caché: si
 * consultara la sesión, dejaría de poder cachearse y cada visita --la enorme
 * mayoría, de gente sin cuenta-- pagaría ese costo. Tiene además una ventaja de
 * privacidad: el HTML cacheado nunca lleva el nombre ni el email de nadie.
 *
 * Mientras no se sabe se muestran los botones, que es lo que ve casi todo el
 * mundo. Para un visitante sin cuenta esto no hace ni un pedido de red:
 * `getUser` ve que no hay sesión en las cookies y contesta sin salir.
 */

type Saludo = {
  nombre: string
  /** Los administradores no tienen perfil propio: su lugar es el backoffice. */
  destino: '/panel' | '/admin'
}

export function AccesoCuenta() {
  const [saludo, setSaludo] = useState<Saludo | null>(null)

  useEffect(() => {
    let vigente = true

    async function leerSesion() {
      const supabase = supabaseBrowser()

      // getUser y no getSession: valida la sesión contra Supabase en vez de
      // creerle a la cookie. Una sesión revocada mostraría "bienvenida" y el
      // panel después la rebotaría al login, que es peor que no saludar.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Las dos lecturas pasan por RLS: cada cuenta sólo puede ver su propio
      // perfil y su propia fila de administrador.
      const [{ data: perfil }, { data: admin }] = await Promise.all([
        supabase.from('profiles').select('nombre').eq('user_id', user.id).maybeSingle(),
        supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
      ])

      if (!vigente) return
      setSaludo({
        // Una cuenta recién creada todavía no tiene perfil vinculado: el email
        // es lo único que la identifica, y es suyo.
        nombre: perfil?.nombre ?? user.email ?? '',
        destino: admin ? '/admin' : '/panel',
      })
    }

    // Cualquier falla --Supabase que no contesta, o el cliente que ni siquiera
    // se puede crear-- deja los botones, que sirven igual. Por eso el cliente
    // se crea adentro de leerSesion: un error afuera de este catch rompería la
    // home entera en vez de sólo quitarle el saludo.
    leerSesion().catch(() => {})

    return () => {
      vigente = false
    }
  }, [])

  if (saludo) {
    return (
      <Link href={saludo.destino} className="btn btn--mini masthead__saludo">
        Te damos la bienvenida,&nbsp;
        <strong className="masthead__nombre">{saludo.nombre}</strong>
      </Link>
    )
  }

  return (
    <div className="masthead__botones">
      <Link href="/ingresar" className="btn btn--mini">
        Ingresar a mi panel
      </Link>
      <Link href="/crear-cuenta" className="btn btn--mini">
        Crear cuenta
      </Link>
    </div>
  )
}
