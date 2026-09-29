/**
 * Decide si una foto puede pasar por el optimizador de imágenes de Next.
 *
 * Las que viven en el bucket `fotos` del proyecto Supabase sí: se sirven
 * redimensionadas al tamaño real del avatar (112px), que es la diferencia entre
 * mandar 30 KB o los 3 MB que salen de la cámara de un teléfono.
 *
 * Las acciones de escritura sólo aceptan rutas propias de ese bucket. Esta
 * comprobación se conserva separada porque se ejecuta al renderizar: si falta
 * la configuración pública, la página sigue funcionando sin optimización.
 */
export function esFotoOptimizable(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  try {
    const candidata = new URL(url)
    const nuestra = new URL(base)
    return (
      candidata.origin === nuestra.origin &&
      candidata.pathname.startsWith('/storage/v1/object/public/fotos/')
    )
  } catch {
    return false
  }
}
