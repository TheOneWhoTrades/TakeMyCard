/**
 * Reglas para las imágenes públicas de un perfil.
 *
 * Las URLs llegan en inputs ocultos que puede modificar el navegador. Por eso
 * no alcanza con que `SubirFoto` las genere: cada acción de servidor confirma
 * que pertenecen al bucket y a la carpeta del perfil antes de guardarlas o
 * borrarlas.
 */
export function fotoValidaDePerfil(url: string | null, profileId: string): string | null {
  if (!url) return null

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null

  try {
    const candidata = new URL(url)
    const nuestra = new URL(base)
    const carpeta = `/storage/v1/object/public/fotos/${profileId}/`

    if (candidata.origin !== nuestra.origin || !candidata.pathname.startsWith(carpeta)) {
      return null
    }

    return candidata.toString()
  } catch {
    return null
  }
}

/** Devuelve una ruta propia segura para `storage.remove()`. */
export function rutaDeFotoPropia(url: string | null, profileId: string): string | null {
  const valida = fotoValidaDePerfil(url, profileId)
  if (!valida) return null

  const carpeta = `/storage/v1/object/public/fotos/${profileId}/`
  return new URL(valida).pathname.slice(carpeta.length) || null
}
