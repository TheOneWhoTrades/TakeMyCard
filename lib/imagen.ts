/**
 * Decide si una foto puede pasar por el optimizador de imágenes de Next.
 *
 * Las que viven en el bucket `fotos` del proyecto Supabase sí: se sirven
 * redimensionadas al tamaño real del avatar (112px), que es la diferencia entre
 * mandar 30 KB o los 3 MB que salen de la cámara de un teléfono.
 *
 * El campo `foto_url` también acepta imágenes alojadas en cualquier otro lado
 * (por ejemplo la que el cliente ya tiene en su web). Esas no están en
 * `remotePatterns` y el optimizador las rechazaría, así que se sirven tal cual.
 */
export function esFotoOptimizable(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  try {
    return new URL(url).hostname === new URL(base).hostname
  } catch {
    return false
  }
}
