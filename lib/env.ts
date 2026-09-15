/**
 * Lectura centralizada de la configuración. Si falta una variable preferimos
 * romper en el arranque con un mensaje claro antes que fallar con un 500
 * incomprensible en la primera consulta.
 */
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copiá .env.example a .env.local ` +
        `(o cargala en Vercel -> Settings -> Environment Variables).`,
    )
  }
  return valor
}

/**
 * URL del proyecto Supabase, pelada.
 *
 * El cliente de Supabase agrega `/rest/v1` (o `/auth/v1`, etc.) por su cuenta.
 * Si la URL ya la trae, las consultas salen a `/rest/v1/rest/v1/...` y Supabase
 * devuelve vacío sin error visible: la app parece andar pero ningún perfil
 * existe. Es un error fácil de cometer copiando del dashboard, y carísimo de
 * diagnosticar, así que se corta acá con un mensaje que dice qué hacer.
 */
export const SUPABASE_URL = () => {
  const valor = requerida(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ).trim()

  const ruta = valor.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '')
  if (ruta) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL tiene que ser la URL pelada del proyecto, sin ` +
        `rutas. Sacale "${ruta}" y dejala como ` +
        `https://<tu-proyecto>.supabase.co — el cliente de Supabase agrega ` +
        `/rest/v1 solo.`,
    )
  }

  return valor.replace(/\/+$/, '')
}

export const SUPABASE_ANON_KEY = () =>
  requerida('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

/** URL pública del sitio, sin barra final. */
export function siteUrl(): string {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL
  if (explicita) return explicita.replace(/\/+$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
